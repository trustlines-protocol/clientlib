import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { TLWallet } from './TLWallet'

import { DeployedIdentity, UserObject } from '../typings'

export class IdentityWallet implements TLWallet {
  // TODO: make this class a TLSigner as part of https://github.com/trustlines-network/clientlib/issues/194

  public provider: TLProvider

  private wallet: ethers.Wallet
  private identityAddress: string

  constructor(provider: TLProvider) {
    this.provider = provider
  }

  public get address(): string {
    return this.identityAddress
  }

  public get pubKey(): string {
    throw new Error('Method not implemented.')
  }

  public async getAddress(): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    return this.address
  }

  /**
   * Creates a new wallet and encrypts it with the provided password.
   * @param password Password to encrypt keystore.
   * @param progressCallback Callback function for encryption progress.
   */
  public async createAccount(
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = ethers.Wallet.createRandom()
    const pubKey = this.wallet.address
    const encryptedKeystore = await this.wallet.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    const deployIdentityEndpoint = 'identities'

    const identity = await this.provider.PostToEndpoint<DeployedIdentity>(
      deployIdentityEndpoint,
      this.wallet.address
    )

    this.identityAddress = identity.identity

    return {
      address: identity.identity,
      keystore: encryptedKeystore,
      pubKey: this.pubKey
    }
  }

  /**
   * Decrypts given keystore and loads wallet.
   * @param encryptedKeystore Encrypted keystore from `createAccount`.
   * @param password Password to decrypt keystore.
   * @param identityAddress the address of the corresponding identity contract
   * @param progressCallback Callback function for decryption progress.
   */
  public async loadAccount(
    encryptedKeystore: string,
    password: string,
    identityAddress: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = await ethers.Wallet.fromEncryptedJson(
      encryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    this.identityAddress = identityAddress

    return {
      address: identityAddress,
      keystore: encryptedKeystore,
      pubKey: this.pubKey
    }
  }

  /**
   * Recovers wallet from mnemonic phrase and encrypts keystore with given password.
   * @param seed Mnemonic seed phrase.
   * @param password Password to encrypt recovered keystore.
   * @param identityAddress the address of the corresponding identity contract
   * @param progressCallback Callback function for encryption progress.
   */
  public async recoverFromSeed(
    seed: string,
    password: string,
    identityAddress: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = ethers.Wallet.fromMnemonic(seed)

    this.identityAddress = identityAddress

    const encryptedKeystore = await this.wallet.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    return {
      address: this.address,
      keystore: encryptedKeystore,
      pubKey: this.pubKey
    }
  }

  /**
   * Recovers wallet from private key and encrypts keystore with given password.
   * @param privateKey Private key to recover wallet from.
   * @param password Password to encrypt recovered keystore.
   * @param identityAddress the address of the corresponding identity contract
   * @param progressCallback Callback function for encryption progress.
   */
  public async recoverFromPrivateKey(
    privateKey: string,
    password: string,
    identityAddress: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = new ethers.Wallet(privateKey)
    this.identityAddress = identityAddress
    const encryptedKeystore = await this.wallet.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    return {
      address: this.address,
      keystore: encryptedKeystore,
      pubKey: this.pubKey
    }
  }

  /**
   * Returns a `Promise` with the mnemonic seed phrase of loaded user.
   */
  public async showSeed(): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    return this.wallet.mnemonic
  }

  /**
   * Returns a `Promise` with the private key of loaded user.
   */
  public async exportPrivateKey(): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    return this.wallet.privateKey
  }

  public async encrypt(msg: string, theirPubKey: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  public async decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    throw new Error('Method not implemented.')
  }
}
