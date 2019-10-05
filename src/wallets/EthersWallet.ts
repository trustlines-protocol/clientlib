import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { TL_WALLET_VERSION, TLWallet, WALLET_TYPE_ETHERS } from './TLWallet'

import utils from '../utils'

import {
  Amount,
  EthersWalletSchema,
  RawTxObject,
  Signature,
  TxInfos,
  UserObject
} from '../typings'

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

  public async getAddress(): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    return this.address
  }

  ////////////////////////
  // Creating Instances //
  ////////////////////////

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

    const serializedWallet = this.serializeWallet(encryptedKeystore)

    return {
      address: this.address,
      pubKey: this.pubKey,
      serializedWallet
    }
  }

  /**
   * Deploys a new identity contract on the chain
   */
  public async deployIdentity(): Promise<string> {
    // This does not have to deploy any identity, because it does not have it
    return this.address
  }

  public async isIdentityDeployed(): Promise<boolean> {
    return false
  }

  /**
   * Create a serialized wallet following the current format from an encryptedKeystore
   * Can be used to migrate from serialized wallet version 0 to serialized wallet version 1
   * @param encryptedKeystore
   */
  public serializeWallet(encryptedKeystore: string): string {
    const deserializedWallet: EthersWalletSchema = {
      TLWalletVersion: TL_WALLET_VERSION,
      ethersKeystore: encryptedKeystore,
      walletType: WALLET_TYPE_ETHERS
    }

    const serializedWallet: string = JSON.stringify(deserializedWallet)

    return serializedWallet
  }

  /**
   * Deserialize the serialized wallet, decrypts given wallet and loads wallet.
   * @param serializedWallet serialized wallet.
   * @param password Password to decrypt wallet.
   * @param progressCallback Callback function for decryption progress.
   */
  public async loadAccount(
    serializedWallet: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    const deserializedWallet: EthersWalletSchema = JSON.parse(serializedWallet)

    let encryptedKeystore: string

    if (!this.correctWalletType(deserializedWallet)) {
      throw new Error(
        `The serialized wallet given is of the wrong wallet type: ${
          deserializedWallet.walletType
        }`
      )
    }

    if (!('TLWalletVersion' in deserializedWallet)) {
      // Use the old serialising method if no TL_WALLET_VERSION key in the deserialized wallet
      encryptedKeystore = serializedWallet
    } else if (deserializedWallet.TLWalletVersion === 1) {
      encryptedKeystore = deserializedWallet.ethersKeystore
    } else {
      throw new Error(
        `serialized wallet version is not handled: version ${
          deserializedWallet.TLWalletVersion
        }`
      )
    }

    this.wallet = await ethers.Wallet.fromEncryptedJson(
      encryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    return {
      address: this.address,
      pubKey: this.pubKey,
      serializedWallet
    }
  }

  /**
   * Recovers wallet from mnemonic phrase and encrypts it with given password.
   * @param seed Mnemonic seed phrase.
   * @param password Password to encrypt recovered wallet.
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

    const serializedWallet = this.serializeWallet(encryptedKeystore)

    return {
      address: this.address,
      pubKey: this.pubKey,
      serializedWallet
    }
  }

  /**
   * Recovers wallet from private key and encrypts it with given password.
   * @param privateKey Private key to recover wallet from.
   * @param password Password to encrypt recovered wallet.
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

    const serializedWallet = this.serializeWallet(encryptedKeystore)

    return {
      address: this.address,
      pubKey: this.pubKey,
      serializedWallet
    }
  }

  /////////////
  // Signing //
  /////////////

  /**
   * Signs given hex hash of message with loaded wallet.
   * @param msgHash Hash of message to sign.
   */
  public async signMsgHash(msgHash: string): Promise<Signature> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    if (!ethers.utils.isHexString(msgHash)) {
      throw new Error('Message hash is not a valid hex string.')
    }
    const msgHashBytes = ethers.utils.arrayify(msgHash)
    return this.signMessage(msgHashBytes)
  }

  /**
   * Signs given message with loaded wallet.
   * @param message Message to sign.
   */
  public async signMessage(message: ethers.utils.Arrayish): Promise<Signature> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    const flatFormatSignature = await this.wallet.signMessage(message)
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

  public async getTxInfos(userAddress: string): Promise<TxInfos> {
    return this.provider.getTxInfos(userAddress)
  }

  private correctWalletType(deserializedWallet: EthersWalletSchema): boolean {
    // Previously, all wallets where `etherswallet` and had no type field
    // so undefined should be considered as the right types
    return (
      deserializedWallet.walletType === undefined ||
      deserializedWallet.walletType === WALLET_TYPE_ETHERS
    )
  }
}
