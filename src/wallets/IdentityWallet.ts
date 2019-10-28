import { isValidAddress, toChecksumAddress } from 'ethereumjs-util'
import { ethers, utils as ethersUtils } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import {
  EXPECTED_VERSIONS,
  TLWallet,
  verifyWalletData,
  WALLET_TYPE_IDENTITY,
  walletDataToWalletFromEthers,
  walletFromEthersToWalletData
} from './TLWallet'

import {
  Amount,
  DeployIdentityResponse,
  IdentityWalletData,
  MetaTransaction,
  RawTxObject,
  Signature,
  TxInfos
} from '../typings'

import utils from '../utils'

// This is the proxy initcode without the address of the owner but with added 0s so that we only need to append the address to it
const initcodeWithPadding =
  '0x608060405234801561001057600080fd5b506040516020806102788339810180604052602081101561003057600080fd5b5050610237806100416000396000f3fe6080604052600436106100295760003560e01c80635c60da1b1461005c578063d784d4261461008d575b600080546040516001600160a01b0390911691369082376000803683855af43d6000833e808015610058573d83f35b3d83fd5b34801561006857600080fd5b506100716100c2565b604080516001600160a01b039092168252519081900360200190f35b34801561009957600080fd5b506100c0600480360360208110156100b057600080fd5b50356001600160a01b03166100d1565b005b6000546001600160a01b031681565b6000546001600160a01b031661010e576000805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b03831617905561018f565b333014610166576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603d8152602001806101cf603d913960400191505060405180910390fd5b6000805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0383161790555b604080516001600160a01b038316815290517f11135eea714a7c1c3b9aebf3d31bbd295f7e7262960215e086849c191d45bddc9181900360200190a15056fe54686520696d706c656d656e746174696f6e2063616e206f6e6c79206265206368616e6765642062792074686520636f6e747261637420697473656c66a165627a7a72305820c05430d1d23a2f20ae202c4f5166b959e7e02eedd737b69d7ccdc2b9697b2b180029000000000000000000000000'

export class IdentityWallet implements TLWallet {
  public provider: TLProvider

  private walletFromEthers: ethers.Wallet
  private identityAddress: string
  private identityFactoryAddress: string
  private identityImplementationAddress: string

  constructor(
    provider: TLProvider,
    { identityFactoryAddress, identityImplementationAddress }
  ) {
    this.identityFactoryAddress = identityFactoryAddress
    this.identityImplementationAddress = identityImplementationAddress
    this.provider = provider
  }

  public get address(): string {
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
    return this.walletFromEthersToIdentityWalletData(this.walletFromEthers)
  }

  public async getBalance(): Promise<Amount> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    const balance = await this.provider.fetchEndpoint<string>(
      `users/${this.address}/balance`
    )
    return utils.formatToAmount(utils.calcRaw(balance, 18), 18)
  }

  /**
   * Creates wallet data of type `identity`.
   */
  public async create(): Promise<IdentityWalletData> {
    const walletFromEthers = ethers.Wallet.createRandom()
    return this.walletFromEthersToIdentityWalletData(walletFromEthers)
  }

  /**
   * Deploys a new identity contract on the chain
   */
  public async deployIdentity(): Promise<string> {
    const messageHash: string = ethers.utils.solidityKeccak256(
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
        `Delegate did not deploy the right identity contract. Deployed ${
          response.identity
        } instead of ${this.address}`
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

  /**
   * Loads given wallet data of type `identity`.
   * @param walletData Wallet data of type `identity`.
   */
  public async loadFrom(walletData: IdentityWalletData): Promise<void> {
    verifyWalletData(walletData, WALLET_TYPE_IDENTITY, EXPECTED_VERSIONS)

    const walletFromEthers = walletDataToWalletFromEthers(walletData)
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
    const walletFromEthers = await ethers.Wallet.fromEncryptedJson(
      serializedEncryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    return this.walletFromEthersToIdentityWalletData(walletFromEthers)
  }

  /**
   * Recovers wallet data from mnemonic phrase.
   * @param seed Mnemonic seed phrase.
   */
  public async recoverFromSeed(seed: string): Promise<IdentityWalletData> {
    const walletFromEthers = ethers.Wallet.fromMnemonic(seed)
    return this.walletFromEthersToIdentityWalletData(walletFromEthers)
  }

  /**
   * Recovers wallet data from private key.
   * Note that mnemonic and derivation path is `undefined` here.
   * @param privateKey Private key to recover wallet data from.
   */
  public async recoverFromPrivateKey(
    privateKey: string
  ): Promise<IdentityWalletData> {
    const walletFromEthers = new ethers.Wallet(privateKey)
    return this.walletFromEthersToIdentityWalletData(walletFromEthers)
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

  public async signMessage(message: ethers.utils.Arrayish): Promise<Signature> {
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

  public async signMetaTransaction(
    metaTransaction: MetaTransaction
  ): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }

    const types = [
      'bytes1',
      'bytes1',
      'address',
      'address',
      'uint256',
      'bytes32',
      'uint64',
      'address',
      'uint256',
      'bytes'
    ]
    const values = [
      '0x19',
      '0x00',
      metaTransaction.from,
      metaTransaction.to,
      metaTransaction.value,
      ethers.utils.solidityKeccak256(['bytes'], [metaTransaction.data]),
      metaTransaction.delegationFees,
      metaTransaction.currencyNetworkOfFees,
      metaTransaction.nonce,
      metaTransaction.extraData
    ]

    const metaTransactionHash: string = ethers.utils.solidityKeccak256(
      types,
      values
    )

    metaTransaction.signature = await this.rawSignHash(metaTransactionHash)

    return metaTransactionHash
  }

  public async getTxInfos(userAddress: string): Promise<TxInfos> {
    return this.provider.getMetaTxInfos(userAddress)
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
    const walletFromEthers = walletDataToWalletFromEthers(walletData)
    const encryptedKeystore = await walletFromEthers.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    return encryptedKeystore
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
        `The from field of the meta-transaction has to match with the address of the identity, from: ${
          rawTx.from
        }`
      )
    }
  }

  private buildMetaTransaction(rawTx: RawTxObject): MetaTransaction {
    const metaTransaction: MetaTransaction = {
      data: rawTx.data || '0x',
      extraData: '0x',
      from: rawTx.from,
      nonce: rawTx.nonce.toString(),
      to: rawTx.to,
      value: rawTx.value.toString(),
      delegationFees: (rawTx.delegationFees || 0).toString(),
      currencyNetworkOfFees: rawTx.currencyNetworkOfFees || rawTx.to
    }

    return metaTransaction
  }

  private walletFromEthersToIdentityWalletData(
    walletFromEthers: ethers.Wallet
  ): IdentityWalletData {
    const identityAddress = calculateIdentityAddress(
      this.identityFactoryAddress,
      walletFromEthers.address
    )
    const walletData = walletFromEthersToWalletData(
      walletFromEthers,
      WALLET_TYPE_IDENTITY,
      identityAddress
    )
    return walletData as IdentityWalletData
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
  const initCodeHash = ethers.utils.solidityKeccak256(['bytes'], [initCode])
  // address = keccak256( 0xff ++ address ++ salt ++ keccak256(init_code))[12:]
  const address =
    '0x' +
    ethers.utils
      .solidityKeccak256(
        ['bytes1', 'address', 'uint', 'bytes32'],
        ['0xff', factoryAddress, 0, initCodeHash]
      )
      .slice(2 + 2 * 12)
  return toChecksumAddress(address)
}
