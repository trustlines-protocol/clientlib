import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { TLWallet } from './TLWallet'

import utils from '../utils'

import { Amount, RawTxObject, Signature, UserObject } from '../typings'

/**
 * The EthersWallet class contains wallet related methods.
 */
export class EthersWallet implements TLWallet {
  public provider: TLProvider

  private wallet: ethers.Wallet

  constructor(provider: TLProvider) {
    this.provider = provider
  }

  ///////////////
  // Accessors //
  ///////////////

  public get address(): string {
    return this.wallet ? this.wallet.address : undefined
  }

  public get pubKey(): string {
    return this.wallet
      ? ethers.utils.computePublicKey(this.wallet.privateKey)
      : undefined
  }

  ////////////////////////
  // Creating Instances //
  ////////////////////////

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
   * Encrypts given keystore and loads wallet.
   * @param encryptedKeystore Encrypted keystore from `createAccount`.
   * @param password Password to decrypt keystore.
   * @param progressCallback Callback function for decryption progress.
   */
  public async loadAccount(
    encryptedKeystore: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = await ethers.Wallet.fromEncryptedJson(
      encryptedKeystore,
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
   * Recovers wallet from mnemonic phrase and encrypts keystore with given password.
   * @param seed Mnemonic seed phrase.
   * @param password Password to encrypt recovered keystore.
   * @param progressCallback Callback function for encryption progress.
   */
  public async recoverFromSeed(
    seed: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = ethers.Wallet.fromMnemonic(seed)
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
   * @param progressCallback Callback function for encryption progress.
   */
  public async recoverFromPrivateKey(
    privateKey: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = new ethers.Wallet(privateKey)
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

  /////////////
  // Signing //
  /////////////

  /**
   * Signs given hash of message with loaded wallet.
   * @param msgHash Hash of message to sign.
   */
  public async signMsgHash(msgHash: string): Promise<Signature> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    const binaryData = ethers.utils.arrayify(msgHash)
    const flatFormatSignature = await this.wallet.signMessage(binaryData)
    const { r, s, v } = ethers.utils.splitSignature(flatFormatSignature)
    return {
      concatSig: flatFormatSignature,
      ecSignature: { r, s, v }
    }
  }

  /**
   * Takes a raw transaction object, turns it into a RLP encoded hex string, signs it with
   * the loaded user and relays the transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    const signedTransaction = await this.wallet.sign({
      data: rawTx.data,
      gasLimit: ethers.utils.bigNumberify(
        rawTx.gasLimit instanceof BigNumber
          ? rawTx.gasLimit.toString()
          : rawTx.gasLimit
      ),
      gasPrice: ethers.utils.bigNumberify(
        rawTx.gasPrice instanceof BigNumber
          ? rawTx.gasPrice.toString()
          : rawTx.gasPrice
      ),
      nonce: rawTx.nonce,
      to: rawTx.to,
      value: ethers.utils.bigNumberify(
        rawTx.value instanceof BigNumber ? rawTx.value.toString() : rawTx.value
      )
    })
    return this.provider.sendSignedTransaction(signedTransaction)
  }

  /////////////
  // Account //
  /////////////

  /**
   * Returns a `Promise` with the balance of loaded user.
   */
  public async getBalance(): Promise<Amount> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    const balance = await this.provider.fetchEndpoint<string>(
      `users/${this.address}/balance`
    )
    return utils.formatToAmount(utils.calcRaw(balance, 18), 18)
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

  /////////////////////////////
  // Encryption / Decryption //
  /////////////////////////////

  public async encrypt(msg: string, theirPubKey: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  public async decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    throw new Error('Method not implemented.')
  }
}
