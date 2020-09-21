import * as ethUtils from 'ethereumjs-util'

import { TLProvider } from './providers/TLProvider'
import { TLSigner } from './signers/TLSigner'
import { TLWallet } from './wallets/TLWallet'

import utils, { defaultBaseUrl } from './utils'

import { Amount, Signature, TLWalletData } from './typings'

/**
 * The [[User]] class contains all user related functions, which also include wallet related methods.
 * It is meant to be called via a [[TLNetwork]] instance like:
 * ```typescript
 * const tlNetwork = new TLNetwork(...)
 *
 * // Create user
 * tlNetwork.user.create().then(
 *  newUser => console.log("New user:", newUser)
 * )
 * ```
 */
export class User {
  private provider: TLProvider
  private signer: TLSigner
  private wallet: TLWallet

  private defaultPassword = 'ts'

  /** @hidden */
  constructor(params: {
    provider: TLProvider
    signer: TLSigner
    wallet: TLWallet
  }) {
    this.provider = params.provider
    this.signer = params.signer
    this.wallet = params.wallet
  }

  /**
   * Checksummed Ethereum address of currently loaded wallet.
   */
  public get address(): string {
    return this.wallet.address
  }

  /**
   * Async `address` getter for loaded user.
   */
  public async getAddress(): Promise<string> {
    return this.signer.getAddress()
  }

  /**
   * Creates a new random wallet based on the configured [[WalletType]].
   * @returns the wallet data that can be used with `loadFrom`
   */
  public async create(): Promise<TLWalletData> {
    return this.wallet.create()
  }

  /**
   * Loads the given wallet data into the library
   * @param tlWalletData data of the wallet to load
   */
  public async loadFrom(tlWalletData: TLWalletData): Promise<void> {
    return this.wallet.loadFrom(tlWalletData)
  }

  /**
   * Returns the wallet data. Can be used with `loadFrom`
   */
  public async getWalletData(): Promise<TLWalletData> {
    return this.wallet.getWalletData()
  }

  /**
   * Deploys a new identity on the chain if the configured [[WalletType]] is [[WalletTypeIdentity]] and returns the transaction hash.
   */
  public async deployIdentity(): Promise<string> {
    return this.wallet.deployIdentity()
  }

  /**
   * Returns a boolean if a new identity already has been deployed for the loaded user.
   */
  public async isIdentityDeployed(): Promise<boolean> {
    return this.wallet.isIdentityDeployed()
  }

  /**
   * Digitally signs a message hash with the currently loaded user/wallet.
   * @param msgHash Hash of message that should be signed.
   */
  public async signMsgHash(msgHash: string): Promise<Signature> {
    return this.signer.signMsgHash(msgHash)
  }

  /**
   * Returns ETH balance of loaded user.
   */
  public async getBalance(): Promise<Amount> {
    return this.signer.getBalance()
  }

  /**
   * @hidden
   * Encrypts a message with the public key of another user.
   * @param msg Plain text message that should get encrypted.
   * @param theirPubKey Public key of receiver of message.
   */
  public async encrypt(msg: string, theirPubKey: string): Promise<any> {
    return this.wallet.encrypt(msg, theirPubKey)
  }

  /**
   * @hidden
   * Decrypts an encrypted message with the private key of loaded user.
   * @param encMsg Encrypted message.
   * @param theirPubKey Public key of sender of message.
   */
  public async decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    return this.wallet.decrypt(encMsg, theirPubKey)
  }

  /**
   * Encrypts and serializes the given wallet data.
   * @param tlWalletData Wallet data to encrypt and serialize.
   * @param password Optional password to encrypt wallet with.
   *                 If not specified default password is used.
   * @param progressCallback Optional encryption progress callback.
   */
  public async encryptToSerializedKeystore(
    tlWalletData: TLWalletData,
    password?: string | ((progress: number) => void),
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    return this.wallet.encryptToSerializedKeystore(
      tlWalletData,
      typeof password === 'string' ? password : this.defaultPassword,
      typeof password === 'function' ? password : progressCallback
    )
  }

  /**
   * Returns the 12 word seed of loaded user.
   */
  public async showSeed(): Promise<string> {
    return this.wallet.showSeed()
  }

  /**
   * Returns the private key of loaded user.
   */
  public async exportPrivateKey(): Promise<string> {
    return this.wallet.exportPrivateKey()
  }

  /**
   * Recovers wallet data from a serialized encrypted JSON keystore string
   * (e.g. as returned by `encryptToSerializedKeystore`).
   * @param serializedEncryptedKeystore Serialized standard JSON keystore.
   * @param password Password to decrypt serialized JSON keystore with.
   * @param progressCallback Optional progress callback to call on encryption progress.
   * @returns the wallet data. Can be used with `loadFrom`
   */
  public async recoverFromEncryptedKeystore(
    serializedEncryptedKeystore: string,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<TLWalletData> {
    return this.wallet.recoverFromEncryptedKeystore(
      serializedEncryptedKeystore,
      password,
      progressCallback
    )
  }

  /**
   * Recovers wallet data from 12 word seed phrase.
   * @param seed 12 word seed phrase string.
   * @returns the wallet data. Can be used with `loadFrom`
   */
  public async recoverFromSeed(seed: string): Promise<TLWalletData> {
    return this.wallet.recoverFromSeed(seed)
  }

  /**
   * Recovers wallet data from private key.
   * @param privateKey Private key to recover wallet data from.
   * @returns wallet data. Can be used with `loadFrom`
   */
  public async recoverFromPrivateKey(
    privateKey: string
  ): Promise<TLWalletData> {
    return this.wallet.recoverFromPrivateKey(privateKey)
  }

  /**
   * Returns a shareable link which can be send to other users.
   * Contains username and address.
   * @param options - any additional options that we should hang on the URL
   *        options.customBase - convention for a custom base for the URL
   *        options.name - convention for a name for the user
   *        options[key] - any other additional options that should be added to the URL
   */
  public async createLink(options: {
    [key: string]: string
    customBase?: string
    name?: string
  }): Promise<string> {
    const path = ['contact', await this.getAddress()]
    const { customBase = defaultBaseUrl, ...rest } = options
    return utils.buildUrl(customBase, { path, query: rest })
  }

  /**
   * @hidden
   * Gives some ETH to requesting address.
   * NOTE: Used only for dev purposes.
   */
  public async requestEth(): Promise<string> {
    const options = {
      body: JSON.stringify({ address: await this.getAddress() }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
      method: 'POST'
    }
    return this.provider.fetchEndpoint<string>(`request-ether`, options)
  }

  /**
   * @hidden
   * Verifies a signature.
   * @param message Signed message
   * @param signature Digital signature
   */
  public verifySignature(message: any, signature: string): boolean {
    const r = ethUtils.toBuffer(signature.slice(0, 66))
    const s = ethUtils.toBuffer(`0x${signature.slice(66, 130)}`)
    const v = ethUtils.bufferToInt(
      ethUtils.toBuffer(`0x${signature.slice(130, 132)}`)
    )
    const m = ethUtils.sha3(JSON.stringify(message))
    const pub = ethUtils.ecrecover(m, v, r, s)
    const adr = `0x${ethUtils.pubToAddress(pub).toString('hex')}`
    return message.address === adr
  }
}
