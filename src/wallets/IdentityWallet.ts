import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { TL_WALLET_VERSION, TLWallet, WALLET_TYPE_IDENTITY } from './TLWallet'

import { DeployedIdentity, IdentityBackup, UserObject } from '../typings'

export class IdentityWallet implements TLWallet {
  // TODO: make this class a TLSigner as part of https://github.com/trustlines-network/clientlib/issues/194

  public provider: TLProvider

  private wallet: ethers.Wallet
  private identityAddress: string

  private readonly ADDRESS_SIZE = 42

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
   * @param password Password to encrypt backup.
   * @param progressCallback Callback function for encryption progress.
   */
  public async createAccount(
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = ethers.Wallet.createRandom()

    const encryptedKeystore = await this.wallet.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    const deployIdentityEndpoint = 'identities'

    const identity = await this.provider.postToEndpoint<DeployedIdentity>(
      deployIdentityEndpoint,
      this.wallet.address
    )

    this.identityAddress = identity.identity

    const backup: string = this.createBackup(
      encryptedKeystore,
      identity.identity
    )

    return {
      address: identity.identity,
      backup,
      pubKey: 'Not implemented yet'
    }
  }

  /**
   * Decrypts given backup and loads wallet.
   * @param encryptedKeystore Encrypted backup from `createAccount`.
   * @param password Password to decrypt backup.
   * @param identityAddress the address of the corresponding identity contract
   * @param progressCallback Callback function for decryption progress.
   */
  public async loadAccount(
    backup: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    const identityBackup: IdentityBackup = JSON.parse(backup)

    this.verifyIdentityBackupHandled(identityBackup)

    const encryptedKeystore = identityBackup.ethersKeystore
    const identityAddress = identityBackup.identityAddress

    this.wallet = await ethers.Wallet.fromEncryptedJson(
      encryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    this.identityAddress = identityAddress

    return {
      address: identityAddress,
      backup,
      pubKey: 'Not implemented yet'
    }
  }

  /**
   * Recovers wallet from mnemonic phrase and encrypts backup with given password.
   * @param seed Mnemonic seed phrase.
   * @param password Password to encrypt recovered backup.
   * @param progressCallback Callback function for encryption progress.
   */
  public async recoverFromSeed(
    seed: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    throw new Error('Method not implemented.')
  }

  /**
   * Recovers wallet from private key and encrypts backup with given password.
   * @param privateKey Private key to recover wallet from.
   * @param password Password to encrypt recovered backup.
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

    const backup: string = this.createBackup(encryptedKeystore, identityAddress)

    return {
      address: this.address,
      backup,
      pubKey: 'Not implemented yet'
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

  private createBackup(
    encryptedKeystore: string,
    identityAddress: string
  ): string {
    const identityBackup: IdentityBackup = {
      TLWalletVersion: TL_WALLET_VERSION,
      ethersKeystore: encryptedKeystore,
      identityAddress,
      walletType: WALLET_TYPE_IDENTITY
    }

    const backup: string = JSON.stringify(identityBackup)

    return backup
  }

  private verifyIdentityBackupHandled(identityBackup: IdentityBackup): void {
    const onlyHandledVersion = 1

    if (identityBackup.walletType !== WALLET_TYPE_IDENTITY) {
      throw new Error(
        `The backup given is of a wrong wallet type: ${
          identityBackup.walletType
        }, expected: ${WALLET_TYPE_IDENTITY}`
      )
    }

    if (!('TLWalletVersion' in identityBackup)) {
      throw new Error(`Backup has no version number.`)
    } else if (identityBackup.TLWalletVersion !== onlyHandledVersion) {
      throw new Error(
        `Backup version for wallet is not handled: version ${
          identityBackup.TLWalletVersion
        }, expected: ${onlyHandledVersion}`
      )
    }
  }
}
