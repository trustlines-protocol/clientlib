import * as ethUtils from 'ethereumjs-util'

import { TLProvider } from './providers/TLProvider'
import { TLSigner } from './signers/TLSigner'
import { TLWallet } from './wallets/TLWallet'

import utils from './utils'

import { Amount, Signature, TLWalletSchema, UserObject } from './typings'

/**
 * The User class contains all user related functions, which also include wallet
 * related methods.
 */
export class User {
  private provider: TLProvider
  private signer: TLSigner
  private wallet: TLWallet

  private defaultPassword = 'ts'

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
   * Checksummed Ethereum address of currently loaded user/wallet.
   */
  public get address(): string {
    return this.wallet.address
  }

  /**
   * Public key of currently loaded user/wallet.
   */
  public get pubKey(): string {
    return this.wallet.pubKey
  }

  /**
   * Async `address` getter for loaded user.
   */
  public async getAddress(): Promise<string> {
    return this.signer.getAddress()
  }

  /**
   * Creates a new user and the respective wallet using the configured signer.
   * Loads new user into the state and returns the created user object.
   */
  public async create(): Promise<UserObject> {
    return this.wallet.createAccount()
  }

  /**
   * Loads an existing user and respective wallet.
   * @param tlWallet Wallet to load.
   */
  public async load(tlWallet: TLWalletSchema): Promise<void> {
    return this.wallet.loadAccount(tlWallet)
  }

  /**
   * Deploys a new identity on the chain if it has to
   */
  public async deployIdentity(): Promise<string> {
    return this.wallet.deployIdentity()
  }

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
   * Encrypts a message with the public key of another user.
   * @param msg Plain text message that should get encrypted.
   * @param theirPubKey Public key of receiver of message.
   */
  public async encrypt(msg: string, theirPubKey: string): Promise<any> {
    return this.wallet.encrypt(msg, theirPubKey)
  }

  /**
   * Decrypts an encrypted message with the private key of loaded user.
   * @param encMsg Encrypted message.
   * @param theirPubKey Public key of sender of message.
   */
  public async decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    return this.wallet.decrypt(encMsg, theirPubKey)
  }

  /**
   * Encrypts and serializes the given wallet.
   * @param tlWallet Wallet to encrypt and serialize.
   * @param password Optional password to encrypt wallet with.
   *                 If not specified default password is used.
   * @param progressCallback Optional encryption progress callback.
   */
  public async encryptWallet(
    tlWallet: TLWalletSchema,
    password?: string | ((progress: number) => void),
    progressCallback?: (progress: number) => void
  ): Promise<string> {
    return this.wallet.encryptWallet(
      tlWallet,
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
   * Recovers user / wallet from 12 word seed.
   * @param seed 12 word seed phrase string.
   * @param progressCallback Optional progress callback to call on encryption progress.
   */
  public async recoverFromEncryptedWallet(
    serializedEncryptedWallet: string,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<UserObject> {
    return this.wallet.recoverFromEncryptedWallet(
      serializedEncryptedWallet,
      password,
      progressCallback
    )
  }

  /**
   * Recovers user / wallet from 12 word seed.
   * @param seed 12 word seed phrase string.
   * @param progressCallback Optional progress callback to call on encryption progress.
   */
  public async recoverFromSeed(seed: string): Promise<UserObject> {
    return this.wallet.recoverFromSeed(seed)
  }

  /**
   * Recovers user / wallet from 12 word seed.
   * @param seed 12 word seed phrase string.
   * @param progressCallback Optional progress callback to call on encryption progress.
   */
  public async recoverFromPrivateKey(privateKey: string): Promise<UserObject> {
    return this.wallet.recoverFromPrivateKey(privateKey)
  }

  /**
   * Returns a shareable link which can be send to other users.
   * Contains username and address.
   * @param username Custom username.
   * @param customBase Optional custom base for link. Default `trustlines://`.
   */
  public async createLink(
    username: string,
    customBase?: string
  ): Promise<string> {
    const params = ['contact', this.address, username]
    return utils.createLink(params, customBase)
  }

  /**
   * @hidden
   * Gives some ETH to requesting address.
   * NOTE: Used only for dev purposes.
   */
  public async requestEth(): Promise<string> {
    const options = {
      body: JSON.stringify({ address: this.address }),
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
