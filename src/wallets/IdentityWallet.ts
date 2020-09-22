import { isValidAddress, toChecksumAddress } from 'ethereumjs-util'
import { utils as ethersUtils } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import {
  EXPECTED_VERSIONS,
  TLWallet,
  verifyWalletData,
  WALLET_TYPE_IDENTITY
} from './TLWallet'
import { WalletFromEthers } from './WalletFromEthers'

import { Transaction } from '../Transaction'

import {
  Amount,
  DeployIdentityResponse,
  IdentityWalletData,
  MetaTransaction,
  MetaTransactionFees,
  NonceMechanism,
  RawTxObject,
  Signature,
  TransactionStatusObject,
  TxFeesRaw,
  TxObjectInternal,
  TxObjectRaw,
  TxOptionsInternal
} from '../typings'

import utils from '../utils'

import BigNumber from 'bignumber.js'
import { AddressZero } from 'ethers/constants'

// This is the proxy initcode without the address of the owner but with added 0s so that we only need to append the address to it
const initcodeWithPadding =
  '0x608060405234801561001057600080fd5b506040516020806102178339810180604052602081101561003057600080fd5b50506101d6806100416000396000f3fe6080604052600436106100295760003560e01c80635c60da1b1461005c578063d784d4261461008d575b600080546040516001600160a01b0390911691369082376000803683855af43d6000833e808015610058573d83f35b3d83fd5b34801561006857600080fd5b506100716100c2565b604080516001600160a01b039092168252519081900360200190f35b34801561009957600080fd5b506100c0600480360360208110156100b057600080fd5b50356001600160a01b03166100d1565b005b6000546001600160a01b031681565b6000546001600160a01b03161561014957604080517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601a60248201527f496d706c656d656e746174696f6e20616c726561647920736574000000000000604482015290519081900360640190fd5b600080546001600160a01b03831673ffffffffffffffffffffffffffffffffffffffff19909116811790915560408051918252517f11135eea714a7c1c3b9aebf3d31bbd295f7e7262960215e086849c191d45bddc9181900360200190a15056fea165627a7a7230582009e814f2e28666ad200a2e809c1fe802a9264c378c39d6c2032706ab340c09a40029000000000000000000000000'

const MIN_RANDOM_NONCE = new BigNumber(2).pow(255).plus(1)
const MAX_RANDOM_NONCE = new BigNumber(2).pow(256)
const RANDOM_NONCE_RANGE = MAX_RANDOM_NONCE.minus(MIN_RANDOM_NONCE)

export class IdentityWallet implements TLWallet {
  public provider: TLProvider

  private walletFromEthers: WalletFromEthers
  private identityAddress: string
  private identityFactoryAddress: string
  private identityImplementationAddress: string
  private nonceMechanism: NonceMechanism
  private chainId: number
  private metaTransactionVersion = 1

  constructor(
    provider: TLProvider,
    chainId: number,
    identityFactoryAddress: string,
    identityImplementationAddress: string,
    nonceMechanism: NonceMechanism
  ) {
    this.identityFactoryAddress = identityFactoryAddress
    this.identityImplementationAddress = identityImplementationAddress
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

  public async getWalletData(): Promise<IdentityWalletData> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.walletFromEthers.toIdentityWalletData(this.identityAddress)
  }

  public async getBalance(): Promise<Amount> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.provider.getBalance(this.address)
  }

  /**
   * Creates wallet data of type `identity`.
   */
  public async create(): Promise<IdentityWalletData> {
    const walletFromEthers = WalletFromEthers.createRandom()
    const identityAddress = calculateIdentityAddress(
      this.identityFactoryAddress,
      walletFromEthers.address
    )
    return walletFromEthers.toIdentityWalletData(identityAddress)
  }

  /**
   * Deploys a new identity contract on the chain
   */
  public async deployIdentity(): Promise<string> {
    const messageHash: string = ethersUtils.solidityKeccak256(
      ['bytes1', 'bytes1', 'address', 'address'],
      [
        '0x19',
        '0x00',
        this.identityFactoryAddress,
        this.identityImplementationAddress
      ]
    )
    const signature = await this.rawSignHash(messageHash)

    const deployIdentityEndpoint = 'identities'
    const response = await this.provider.postToEndpoint<DeployIdentityResponse>(
      deployIdentityEndpoint,
      {
        implementationAddress: this.identityImplementationAddress,
        factoryAddress: this.identityFactoryAddress,
        signature
      }
    )
    if (this.address !== response.identity) {
      throw new Error(
        `Delegate did not deploy the right identity contract. Deployed ${response.identity} instead of ${this.address}`
      )
    }

    return this.address
  }

  public async isIdentityDeployed(): Promise<boolean> {
    // If the identity contract is not deployed, the endpoint to get info will fail
    try {
      const response = await this.provider.fetchEndpoint<any>(
        `/identities/${this.address}`
      )
      return true
    } catch (error) {
      if (
        error.message.includes('Status 404') &&
        error.message.includes('Contract not found')
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
    return this.provider.getIdentityImplementationAddress(this.address)
  }

  /**
   * Loads given wallet data of type `identity`.
   * @param walletData Wallet data of type `identity`.
   */
  public async loadFrom(walletData: IdentityWalletData): Promise<void> {
    verifyWalletData(walletData, WALLET_TYPE_IDENTITY, EXPECTED_VERSIONS)

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
  ): Promise<IdentityWalletData> {
    const walletFromEthers = await WalletFromEthers.fromEncryptedJson(
      serializedEncryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    const identityAddress = calculateIdentityAddress(
      this.identityFactoryAddress,
      walletFromEthers.address
    )
    return walletFromEthers.toIdentityWalletData(identityAddress)
  }

  /**
   * Recovers wallet data from mnemonic phrase.
   * @param seed Mnemonic seed phrase.
   */
  public async recoverFromSeed(seed: string): Promise<IdentityWalletData> {
    const walletFromEthers = WalletFromEthers.fromMnemonic(seed)
    const identityAddress = calculateIdentityAddress(
      this.identityFactoryAddress,
      walletFromEthers.address
    )
    return walletFromEthers.toIdentityWalletData(identityAddress)
  }

  /**
   * Recovers wallet data from private key.
   * Note that mnemonic and derivation path is `undefined` here.
   * @param privateKey Private key to recover wallet data from.
   */
  public async recoverFromPrivateKey(
    privateKey: string
  ): Promise<IdentityWalletData> {
    const walletFromEthers = new WalletFromEthers(privateKey)
    const identityAddress = calculateIdentityAddress(
      this.identityFactoryAddress,
      walletFromEthers.address
    )
    return walletFromEthers.toIdentityWalletData(identityAddress)
  }

  /**
   * Returns a `Promise` with the mnemonic seed phrase of loaded user.
   */
  public async showSeed(): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.walletFromEthers.mnemonic
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

  public async signMessage(message: ethersUtils.Arrayish): Promise<Signature> {
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

    const metaTransaction: MetaTransaction = this.buildMetaTransaction(rawTx)

    await this.signMetaTransaction(metaTransaction)

    return this.provider.sendSignedMetaTransaction(metaTransaction)
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
    metaTransaction: MetaTransaction
  ): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }

    const types = [
      'bytes1',
      'bytes1',
      'address',
      'uint256',
      'uint256',
      'address',
      'uint256',
      'bytes32',
      'uint256',
      'uint256',
      'uint256',
      'address',
      'address',
      'uint256',
      'uint256',
      'uint8'
    ]
    const values = [
      '0x19',
      '0x00',
      metaTransaction.from,
      metaTransaction.chainId,
      metaTransaction.version,
      metaTransaction.to,
      metaTransaction.value,
      ethersUtils.solidityKeccak256(['bytes'], [metaTransaction.data]),
      metaTransaction.baseFee,
      metaTransaction.gasPrice,
      metaTransaction.gasLimit,
      metaTransaction.feeRecipient,
      metaTransaction.currencyNetworkOfFees,
      metaTransaction.nonce,
      metaTransaction.timeLimit,
      metaTransaction.operationType
    ]

    return ethersUtils.solidityKeccak256(types, values)
  }

  public async signMetaTransaction(
    metaTransaction: MetaTransaction
  ): Promise<string> {
    const metaTransactionHash = await this.hashMetaTransaction(metaTransaction)
    metaTransaction.signature = await this.rawSignHash(metaTransactionHash)

    return metaTransactionHash
  }

  public async prepareTransaction(rawTx: RawTxObject): Promise<TxObjectRaw> {
    rawTx.nonce = await this.getNonce() // Must take place before the fee calculation!

    const metaTxFees = await this.getMetaTxFees(rawTx)

    rawTx.gasPrice = rawTx.gasPrice || new BigNumber(metaTxFees.gasPrice)
    rawTx.baseFee = rawTx.baseFee || new BigNumber(metaTxFees.baseFee)
    rawTx.totalFee = utils.calculateDelegationFees(
      rawTx.baseFee,
      rawTx.gasPrice,
      rawTx.gasLimit
    )

    const txFees = {
      gasPrice: rawTx.gasPrice,
      gasLimit: rawTx.gasLimit,
      baseFee: rawTx.baseFee,
      totalFee: rawTx.totalFee,
      feeRecipient: rawTx.feeRecipient || metaTxFees.feeRecipient,
      currencyNetworkOfFees:
        rawTx.currencyNetworkOfFees || metaTxFees.currencyNetworkOfFees
    }

    rawTx.feeRecipient =
      rawTx.feeRecipient || metaTxFees.feeRecipient || AddressZero
    rawTx.currencyNetworkOfFees =
      rawTx.currencyNetworkOfFees ||
      metaTxFees.currencyNetworkOfFees ||
      AddressZero

    return {
      rawTx,
      txFees
    }
  }

  public async getMetaTxFees(rawTx: RawTxObject): Promise<MetaTransactionFees> {
    this.verifyFromField(rawTx)

    const metaTx = this.buildMetaTransaction(rawTx)
    return this.provider.getMetaTxFees(metaTx)
  }

  public async getTxStatus(
    tx: string | RawTxObject
  ): Promise<TransactionStatusObject> {
    const txHash = typeof tx === 'string' ? tx : await this.hashTx(tx)
    return this.provider.getMetaTxStatus(this.address, txHash)
  }

  /**
   * Returns a serialized encrypted ethereum JSON keystore v3.
   * @param walletData Wallet data of type `identity`.
   * @param password Password to encrypt wallet data.
   * @param progressCallback Optional encryption progress callback.
   */
  public async encryptToSerializedKeystore(
    walletData: IdentityWalletData,
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

  public buildMetaTransaction(rawTx: RawTxObject): MetaTransaction {
    const zeroAddress = '0x' + '0'.repeat(40)
    return {
      data: rawTx.data || '0x',
      from: rawTx.from,
      chainId: this.chainId,
      version: this.metaTransactionVersion,
      nonce: rawTx.nonce.toString(),
      to: rawTx.to,
      value: rawTx.value.toString(),
      baseFee: rawTx.baseFee ? rawTx.baseFee.toString() : '0',
      gasPrice: rawTx.gasPrice ? rawTx.gasPrice.toString() : '0',
      gasLimit: rawTx.gasLimit ? rawTx.gasLimit.toString() : '0',
      feeRecipient: rawTx.feeRecipient || zeroAddress,
      currencyNetworkOfFees: rawTx.currencyNetworkOfFees || zeroAddress,
      timeLimit: '0',
      operationType: 0
    }
  }

  public async getNonce(): Promise<string> {
    switch (this.nonceMechanism) {
      case NonceMechanism.Random:
        return getRandomNonce()

      case NonceMechanism.Counting:
        const nonce = await this.provider.getIdentityNonce(this.address)
        return nonce.toString()

      default:
        throw new Error(
          `Can not generate nonce for unknown mechanism: ${this.nonceMechanism}`
        )
    }
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
  private async rawSignHash(hash: string): Promise<string> {
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
    const signature = ethersUtils.joinSignature(
      await signingKey.signDigest(hash)
    )
    return signature
  }

  private verifyFromField(rawTx: RawTxObject) {
    if (!(rawTx.from === this.address)) {
      throw new Error(
        `The from field of the meta-transaction has to match with the address of the identity, from: ${rawTx.from}`
      )
    }
  }
}

export function calculateIdentityAddress(
  factoryAddress: string,
  ownerAddress: string
) {
  if (!isValidAddress(factoryAddress)) {
    throw new Error(`Invalid factory address: ${factoryAddress}`)
  }
  if (!isValidAddress(ownerAddress)) {
    throw new Error(`Invalid owner address: ${ownerAddress}`)
  }

  const initCode = initcodeWithPadding + ownerAddress.slice(2)
  const initCodeHash = ethersUtils.solidityKeccak256(['bytes'], [initCode])
  // address = keccak256( 0xff ++ address ++ salt ++ keccak256(init_code))[12:]
  const address =
    '0x' +
    ethersUtils
      .solidityKeccak256(
        ['bytes1', 'address', 'uint', 'bytes32'],
        ['0xff', factoryAddress, 0, initCodeHash]
      )
      .slice(2 + 2 * 12)
  return toChecksumAddress(address)
}

/**
 * Generates a random nonce to use for meta transactions.
 * The nonce fits into the range of ]2^255, 2^256[.
 * This is an alternative to the up counting nonce (]0, 2^255[) without the need
 * to query a [[TLProvider]].
 */
export function getRandomNonce(): string {
  const exponentialMagnitute = MAX_RANDOM_NONCE.e + 1
  const BigNumberForRandomNonces = BigNumber.clone({
    EXPONENTIAL_AT: exponentialMagnitute,
    ROUNDING_MODE: BigNumber.ROUND_DOWN
  })
  const random = BigNumberForRandomNonces.random(exponentialMagnitute)
  const nonce = random.multipliedBy(RANDOM_NONCE_RANGE).plus(MIN_RANDOM_NONCE)
  return nonce.integerValue().toString()
}
