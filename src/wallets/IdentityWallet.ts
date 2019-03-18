import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { TL_WALLET_VERSION, TLWallet, WALLET_TYPE_IDENTITY } from './TLWallet'

import {
  DeployIdentityResponse,
  IdentityWalletSchema,
  UserObject
} from '../typings'

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
   * @param password Password to encrypt wallet.
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

    const identity = await this.provider.postToEndpoint<DeployIdentityResponse>(
      deployIdentityEndpoint,
      {
        ownerAddress: this.wallet.address
      }
    )

    this.identityAddress = identity.identity

    const serializedWallet: string = this.serializeWallet(
      encryptedKeystore,
      identity.identity
    )

    return {
      address: identity.identity,
      pubKey: 'Not implemented yet',
      serializedWallet
    }
  }

  /**
   * Decrypts given serialized wallet and loads wallet.
   * @param serializedWallet serialized wallet from `createAccount`.
   * @param password Password to decrypt wallet.
   * @param progressCallback Callback function for decryption progress.
   */
  public async loadAccount(
    serializedWallet: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    const deserializedWallet: IdentityWalletSchema = JSON.parse(
      serializedWallet
    )

    this.verifyDeserializedWalletHandled(deserializedWallet)

    const encryptedKeystore = deserializedWallet.ethersKeystore
    const identityAddress = deserializedWallet.identityAddress

    this.wallet = await ethers.Wallet.fromEncryptedJson(
      encryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    this.identityAddress = identityAddress

    return {
      address: identityAddress,
      pubKey: 'Not implemented yet',
      serializedWallet
    }
  }

  /**
   * Should recover wallet from mnemonic phrase and encrypts it with given password.
   * Method not implemented yet
   * @param seed Mnemonic seed phrase.
   * @param password Password to encrypt recovered wallet.
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
   * Recovers wallet from private key and encrypts wallet with given password.
   * @param privateKey Private key to recover wallet from.
   * @param password Password to encrypt recovered wallet.
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

    const serializedWallet: string = this.serializeWallet(
      encryptedKeystore,
      identityAddress
    )

    return {
      address: this.address,
      pubKey: 'Not implemented yet',
      serializedWallet
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

  private serializeWallet(
    encryptedKeystore: string,
    identityAddress: string
  ): string {
    const deserializedWallet: IdentityWalletSchema = {
      TLWalletVersion: TL_WALLET_VERSION,
      ethersKeystore: encryptedKeystore,
      identityAddress,
      walletType: WALLET_TYPE_IDENTITY
    }

    const serializedWallet: string = JSON.stringify(deserializedWallet)

    return serializedWallet
  }

  private verifyDeserializedWalletHandled(
    deserializedWallet: IdentityWalletSchema
  ): void {
    const onlyHandledVersion = 1

    if (deserializedWallet.walletType !== WALLET_TYPE_IDENTITY) {
      throw new Error(
        `The serialized wallet given is of a wrong wallet type: ${
          deserializedWallet.walletType
        }, expected: ${WALLET_TYPE_IDENTITY}`
      )
    }

    if (!('TLWalletVersion' in deserializedWallet)) {
      throw new Error(`serialized wallet has no version number.`)
    } else if (deserializedWallet.TLWalletVersion !== onlyHandledVersion) {
      throw new Error(
        `serialized wallet version for wallet is not handled: version ${
          deserializedWallet.TLWalletVersion
        }, expected: ${onlyHandledVersion}`
      )
    }
  }
}
