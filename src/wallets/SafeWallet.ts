import { BytesLike } from '@ethersproject/bytes'
import { AddressZero } from '@ethersproject/constants'
import { privateToAddress, toChecksumAddress } from 'ethereumjs-util'
import { ethers, utils as ethersUtils } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { Transaction } from '../Transaction'
import {
  EXPECTED_VERSIONS,
  TLWallet,
  verifyWalletData,
  WALLET_TYPE_SAFE
} from './TLWallet'
import { WalletFromEthers } from './WalletFromEthers'

import {
  Amount,
  NonceMechanism,
  RawTxObject,
  SafeMetaTransaction,
  SafeSignature,
  SafeTransactionFees,
  SafeWalletData,
  Signature,
  TransactionStatusObject,
  TxObjectInternal,
  TxObjectRaw,
  TxOptionsInternal
} from '../typings'

import BigNumber from 'bignumber.js'

import { AbiCoder, Interface } from '@ethersproject/abi'
import { getCreate2Address } from '@ethersproject/address'
import { getSafeSingletonDeployment } from '@gnosis.pm/safe-deployments'

import { keccak256, solidityKeccak256 } from 'ethers/lib/utils'
import { SafeRelayProvider } from '../providers/SafeRelayProvider'

export class SafeWallet implements TLWallet {
  public provider: TLProvider

  private walletFromEthers: WalletFromEthers
  private identityAddress: string
  private identityFactoryAddress: string
  private identityImplementationAddress: string
  private gnosisSafeL2Address: string
  private gnosisSafeProxyFactoryAddress: string
  private nonceMechanism: NonceMechanism
  private chainId: number
  private metaTransactionVersion = 1
  private safeRelayProvider: SafeRelayProvider

  constructor(
    provider: TLProvider,
    safeRelayProvider: SafeRelayProvider,
    chainId: number,
    identityFactoryAddress: string,
    identityImplementationAddress: string,
    gnosisSafeL2Address: string,
    gnosisSafeProxyFactoryAddress: string,
    nonceMechanism: NonceMechanism
  ) {
    this.identityFactoryAddress = identityFactoryAddress
    this.identityImplementationAddress = identityImplementationAddress
    this.gnosisSafeL2Address = gnosisSafeL2Address
    this.gnosisSafeProxyFactoryAddress = gnosisSafeProxyFactoryAddress
    this.safeRelayProvider = safeRelayProvider
    this.nonceMechanism = nonceMechanism
    this.provider = provider
    this.chainId = chainId
  }

  // The address function is a convenient way to access to address in a synchronous method
  public get address(): string {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }

    return this.identityAddress
  }

  public async getAddress(): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.address
  }

  public async getWalletData(): Promise<SafeWalletData> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }

    return this.walletFromEthers.toSafeWalletData(this.identityAddress)
  }

  public async getBalance(): Promise<Amount> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.safeRelayProvider.getBalance(this.address)
  }

  /**
   * Creates wallet data of type `identity`.
   */
  public async create(): Promise<SafeWalletData> {
    const walletFromEthers = WalletFromEthers.createRandom()
    const identityAddress = calculateSafeAddress(
      walletFromEthers.address,
      this.gnosisSafeL2Address,
      this.gnosisSafeProxyFactoryAddress
    )

    return walletFromEthers.toSafeWalletData(identityAddress)
  }

  public async waitForSafeToBeDeployed(safeAddress: string): Promise<boolean> {
    let timer = 0
    const delay = 2000
    return new Promise((resolve, reject) => {
      // poll the relay service until the safe is deployed on chain
      const interval = setInterval(async () => {
        if (timer > 120000) {
          clearInterval(interval)
          reject(new Error('Safe was not mined within 60 seconds.'))
        }
        const response = await this.safeRelayProvider.plainFetch(
          `v1/safes/${safeAddress}/`
        )

        if (response.status === 200) {
          const responseJson = await response.json()

          if (responseJson.address) {
            clearInterval(interval)
            resolve(true)
          }
        }

        timer += delay
      }, delay)
    })
  }

  /**
   * Deploys a new identity contract on the chain
   */
  public async deployIdentity(): Promise<string> {
    const walletData = await this.getWalletData()
    const publicAddress = await privateToAddress(
      walletData.meta.signingKey.privateKey
    )

    const deployIdentityEndpoint = 'v3/safes/'

    try {
      const response = await this.safeRelayProvider.postToEndpoint<any>(
        deployIdentityEndpoint,
        {
          owners: [toChecksumAddress(publicAddress.toString('hex'))],
          threshold: 1,
          saltNonce: 0
        }
      )

      if (this.address !== response.safe) {
        throw new Error(
          `Delegate did not deploy the right identity contract. Deployed ${response.safe} instead of ${this.address}`
        )
      }

      const deployed = await this.waitForSafeToBeDeployed(this.address)

      if (deployed) {
        return this.address
      }
    } catch (e) {
      throw new Error(e)
    }
  }

  public async isIdentityDeployed(): Promise<boolean> {
    // If the identity contract is not deployed, the endpoint to get info will fail
    try {
      const response = await this.safeRelayProvider.fetchEndpoint<any>(
        `v1/safes/${this.address}`
      )

      if ([404, 422].includes(response.status)) {
        return false
      }
      return true
    } catch (error) {
      if (
        error.message.includes('Status 422') ||
        (error.message.includes('Status 404') &&
          error.message.includes('Contract not found'))
      ) {
        return false
      } else {
        throw error
      }
    }
  }

  public async isIdentityImplementationUpToDate(): Promise<boolean> {
    return (
      (await this.getIdentityImplementationAddress()) ===
      this.identityImplementationAddress
    )
  }

  public async getIdentityImplementationAddress(): Promise<string> {
    return this.safeRelayProvider.getIdentityImplementationAddress(this.address)
  }

  /**
   * Loads given wallet data of type `identity`.
   * @param walletData Wallet data of type `identity`.
   */
  public async loadFrom(walletData: SafeWalletData): Promise<void> {
    verifyWalletData(walletData, WALLET_TYPE_SAFE, EXPECTED_VERSIONS)

    const walletFromEthers = WalletFromEthers.fromWalletData(walletData)
    this.walletFromEthers = walletFromEthers
    this.identityAddress = walletData.address
  }

  /**
   * Recovers wallet data from a serialized encrypted ethereum JSON keystore v3
   * (e.g. as returned by `encryptToSerializedKeystore`).
   * @param serializedEncryptedKeystore Serialized encrypted ethereum JSON keystore v3.
   * @param password Password to decrypt serialized encrypted ethereum JSON keystore v3 with.
   * @param progressCallback Callback function for decryption progress.
   */
  public async recoverFromEncryptedKeystore(
    serializedEncryptedKeystore: string,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<SafeWalletData> {
    const walletFromEthers = await WalletFromEthers.fromEncryptedJson(
      serializedEncryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    const identityAddress = calculateSafeAddress(
      walletFromEthers.address,
      this.gnosisSafeL2Address,
      this.gnosisSafeProxyFactoryAddress
    )
    return walletFromEthers.toSafeWalletData(identityAddress)
  }

  /**
   * Recovers wallet data from mnemonic phrase.
   * @param seed Mnemonic seed phrase.
   */
  public async recoverFromSeed(seed: string): Promise<SafeWalletData> {
    const walletFromEthers = WalletFromEthers.fromMnemonic(seed)

    const identityAddress = calculateSafeAddress(
      walletFromEthers.address,
      this.gnosisSafeL2Address,
      this.gnosisSafeProxyFactoryAddress
    )

    return walletFromEthers.toSafeWalletData(identityAddress)
  }

  /**
   * Recovers wallet data from private key.
   * Note that mnemonic and derivation path is `undefined` here.
   * @param privateKey Private key to recover wallet data from.
   */
  public async recoverFromPrivateKey(
    privateKey: string
  ): Promise<SafeWalletData> {
    const walletFromEthers = new WalletFromEthers(privateKey)
    const identityAddress = calculateSafeAddress(
      walletFromEthers.address,
      this.gnosisSafeL2Address,
      this.gnosisSafeProxyFactoryAddress
    )
    return walletFromEthers.toSafeWalletData(identityAddress)
  }

  /**
   * Returns a `Promise` with the mnemonic seed phrase of loaded user.
   */
  public async showSeed(): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.walletFromEthers.mnemonic.phrase
  }

  /**
   * Returns a `Promise` with the private key of loaded user.
   */
  public async exportPrivateKey(): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.walletFromEthers.privateKey
  }

  public async encrypt(msg: string, theirPubKey: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  public async decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  public async signMsgHash(msgHash: string): Promise<Signature> {
    throw new Error('Method not implemented.')
  }

  public async signMessage(message: BytesLike): Promise<Signature> {
    throw new Error('Method not implemented.')
  }

  /**
   * Takes a raw transaction object, turns it into a meta-transaction signed by
   * the loaded user and relays the transaction.
   * @param rawTx Raw transaction object.
   * @returns the hash of the meta-transaction
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    this.verifyFromField(rawTx)

    const metaTransaction: SafeMetaTransaction = this.buildMetaTransaction(
      rawTx
    )

    await this.signMetaTransaction(metaTransaction)

    return this.safeRelayProvider.sendSignedMetaTransaction(metaTransaction)
  }

  /**
   * Return the meta-tx hash for given raw transaction for loaded user
   * @param rawTx
   */
  public async hashTx(rawTx: RawTxObject): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }

    return this.hashMetaTransaction(this.buildMetaTransaction(rawTx))
  }

  public async hashMetaTransaction(
    metaTransaction: SafeMetaTransaction
  ): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }

    // keccak256(
    //     "SafeTx(address to,uint256 value,bytes data,uint8 operation,uint256 safeTxGas,uint256 baseGas,uint256 gasPrice,address gasToken,address refundReceiver,uint256 nonce)"
    // );
    const SAFE_TX_TYPEHASH =
      '0xbb8310d486368db6bd6f849402fdd73ad53d316b5a4b2644ad6efe0f941286d8'

    // keccak256(
    //     "EIP712Domain(uint256 chainId,address verifyingContract)"
    // );
    const DOMAIN_SEPARATOR_TYPEHASH =
      '0x47e79534a245952e8b16893a336b85a3d9ea9fa8c573f3d803afb92a79469218'

    const {
      to,
      value,
      data,
      operation,
      safeTxGas,
      baseGas,
      gasPrice,
      gasToken,
      refundReceiver,
      nonce
    } = metaTransaction

    const domainSeparator = keccak256(
      ethers.utils.defaultAbiCoder.encode(
        ['bytes32', 'uint256', 'address'],
        [
          DOMAIN_SEPARATOR_TYPEHASH,
          metaTransaction.chainId,
          metaTransaction.safe
        ]
      )
    )

    const safeTxHash = keccak256(
      ethers.utils.defaultAbiCoder.encode(
        [
          'bytes32',
          'address',
          'uint256',
          'bytes32',
          'uint8',
          'uint256',
          'uint256',
          'uint256',
          'address',
          'address',
          'uint256'
        ],
        [
          SAFE_TX_TYPEHASH,
          to,
          value,
          keccak256(data),
          operation,
          safeTxGas,
          baseGas,
          gasPrice,
          gasToken,
          refundReceiver,
          nonce
        ]
      )
    )

    return solidityKeccak256(
      ['bytes1', 'bytes1', 'bytes32', 'bytes32'],
      ['0x19', '0x01', domainSeparator, safeTxHash]
    )
  }

  public async signMetaTransaction(
    metaTransaction: SafeMetaTransaction
  ): Promise<string> {
    const metaTransactionHash = await this.hashMetaTransaction(metaTransaction)

    metaTransaction.signatures = [await this.rawSignHash(metaTransactionHash)]

    return metaTransactionHash
  }

  public async prepareTransaction(rawTx: RawTxObject): Promise<TxObjectRaw> {
    rawTx.nonce = await this.getNonce() // Must take place before the fee calculation!

    const metaTxFees = await this.getMetaTxFees(rawTx)
    rawTx.gasPrice = new BigNumber(metaTxFees.gasPrice)
    rawTx.baseFee = new BigNumber(0)
    rawTx.safeTxGas = new BigNumber(rawTx.gasLimit || metaTxFees.safeTxGas)
    rawTx.baseGas = new BigNumber(metaTxFees.baseGas)
    rawTx.totalFee = this.calculateDelegationFees(
      metaTxFees.safeTxGas,
      metaTxFees.baseGas,
      metaTxFees.gasPrice
    )

    const txFees = {
      gasPrice: rawTx.gasPrice,
      gasLimit: rawTx.gasLimit,
      baseFee: rawTx.baseFee,
      totalFee: rawTx.totalFee,
      feeRecipient: rawTx.feeRecipient || metaTxFees.refundReceiver,
      currencyNetworkOfFees: rawTx.currencyNetworkOfFees || metaTxFees.gasToken
    }

    rawTx.feeRecipient =
      rawTx.feeRecipient || metaTxFees.refundReceiver || AddressZero
    rawTx.currencyNetworkOfFees =
      rawTx.currencyNetworkOfFees || metaTxFees.gasToken || AddressZero

    return {
      rawTx,
      txFees
    }
  }

  public async getMetaTxFees(rawTx: RawTxObject): Promise<SafeTransactionFees> {
    this.verifyFromField(rawTx)

    const metaTx = this.buildMetaTransaction(rawTx)
    return this.safeRelayProvider.getMetaTxFees(metaTx)
  }

  public async getTxStatus(
    metaTx: string | RawTxObject
  ): Promise<TransactionStatusObject> {
    const txHash =
      typeof metaTx === 'string' ? metaTx : await this.hashTx(metaTx)
    return this.safeRelayProvider.getMetaTxStatus(this.address, txHash)
  }

  /**
   * Returns a serialized encrypted ethereum JSON keystore v3.
   * @param walletData Wallet data of type `identity`.
   * @param password Password to encrypt wallet data.
   * @param progressCallback Optional encryption progress callback.
   */
  public async encryptToSerializedKeystore(
    walletData: SafeWalletData,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<string> {
    const walletFromEthers = WalletFromEthers.fromWalletData(walletData)
    const encryptedKeystore = await walletFromEthers.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    return encryptedKeystore
  }

  public buildMetaTransaction(rawTx: RawTxObject): SafeMetaTransaction {
    return {
      safe: rawTx.from,
      to: rawTx.to,
      value: (rawTx.value || 0).toString(),
      data: rawTx.data || '0x',
      operation: 0,
      safeTxGas: (rawTx.safeTxGas || 0).toString(),
      dataGas: (rawTx.baseGas || 0).toString(),
      baseGas: (rawTx.baseGas || 0).toString(),
      gasPrice: (rawTx.gasPrice || 0).toString(),
      refundReceiver: rawTx.feeRecipient,
      nonce: rawTx.nonce.toString(),
      gasToken: rawTx.currencyNetworkOfFees,
      chainId: this.chainId
    }
  }

  public async getNonce(): Promise<string> {
    const nonce = await this.safeRelayProvider.getSafeNonce(this.address)
    return nonce.toString()
  }

  public async prepareImplementationUpdate(
    transaction: Transaction,
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    // TODO: maybe check that the implementation actually needs updating?
    return transaction.prepareContractTransaction(
      this.address,
      this.address,
      'Identity',
      'changeImplementation',
      [this.identityImplementationAddress],
      options
    )
  }

  /**
   * Takes a string hash and signs it using the loaded wallet without appending `\x19Ethereum Signed Message:\n` to it
   * and hashing it again, contrary to what ethers.sign or ethers.signMessage does.
   * @param hash The hash to sign.
   */
  private async rawSignHash(hash: string): Promise<SafeSignature> {
    // We expect the hash to be 256 bits represented as a hex string prefixed with "0x"
    const expectedHashLength = (256 / 8) * 2 + 2
    if (hash.length !== expectedHashLength) {
      throw new Error(
        `The input hash given is not a hash hex string prefixed with "0x": ${hash}`
      )
    }

    // This is a trick to use ethers to sign the hash without appending `\x19Ethereum Signed Message:\n`
    const signingKey = new ethersUtils.SigningKey(
      this.walletFromEthers.privateKey
    )

    const { r, s, v } = await signingKey.signDigest(hash)

    return { r: new BigNumber(r).toFixed(), s: new BigNumber(s).toFixed(), v }
  }

  private verifyFromField(rawTx: RawTxObject) {
    if (!(rawTx.from === this.address)) {
      throw new Error(
        `The from field of the meta-transaction has to match with the address of the identity, from: ${rawTx.from}`
      )
    }
  }

  private calculateDelegationFees(
    safeTxGas: string | BigNumber,
    baseGas: string | BigNumber,
    gasPrice: number | string | BigNumber
  ): BigNumber {
    safeTxGas = new BigNumber(safeTxGas)
    baseGas = new BigNumber(baseGas)
    gasPrice = new BigNumber(gasPrice)

    return gasPrice.multipliedBy(baseGas.plus(safeTxGas))
  }
}

export function calculateSafeAddress(
  ownerAddress: string,
  gnosisSafeL2Address: string,
  gnosisSafeProxyFactoryAddress: string
) {
  const from = gnosisSafeProxyFactoryAddress
  const safeSingleton130 = getSafeSingletonDeployment({ version: '1.3.0' })

  const abi = new Interface(safeSingleton130.abi)

  // We add 64 bytes at the end, because the safe relay encrypts the 0 bytes differently tahn the
  // encodeFunctionData from ethersjs
  const initializer =
    abi.encodeFunctionData('setup', [
      [ownerAddress],
      1,
      AddressZero,
      '0x',
      AddressZero,
      AddressZero,
      0,
      AddressZero
    ]) + '0'.repeat(64)

  const saltNonce = '0'
  const defaultCoder = new AbiCoder()
  const encodedNonce = defaultCoder.encode(['uint256'], [saltNonce])

  const salt = solidityKeccak256(
    ['bytes', 'uint256'],
    [solidityKeccak256(['bytes'], [initializer]), encodedNonce]
  )

  const proxyCreationCode =
    '0x608060405234801561001057600080fd5b506040516101e63803806101e68339818101604052602081101561003357600080fd5b8101908080519060200190929190505050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff1614156100ca576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260228152602001806101c46022913960400191505060405180910390fd5b806000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055505060ab806101196000396000f3fe608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea2646970667358221220d1429297349653a4918076d650332de1a1068c5f3e07c5c82360c277770b955264736f6c63430007060033496e76616c69642073696e676c65746f6e20616464726573732070726f7669646564'

  const constructorData = defaultCoder.encode(
    ['address'],
    [gnosisSafeL2Address]
  )

  const initCode = proxyCreationCode + constructorData.slice(-64)

  return getCreate2Address(from, salt, solidityKeccak256(['bytes'], [initCode]))
}
