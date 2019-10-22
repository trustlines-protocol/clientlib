import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { TL_WALLET_VERSION, TLWallet, WALLET_TYPE_ETHERS } from './TLWallet'

import utils from '../utils'

import {
  Amount,
  EncryptedTLWalletSchema,
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

  // Wallet instance as returned by `ethers`
  private walletFromEthers: ethers.Wallet

  constructor(provider: TLProvider) {
    this.provider = provider
  }

  ///////////////
  // Accessors //
  ///////////////

  public get address(): string {
    return this.walletFromEthers ? this.walletFromEthers.address : undefined
  }

  public get pubKey(): string {
    return this.walletFromEthers
      ? ethers.utils.computePublicKey(this.walletFromEthers.privateKey)
      : undefined
  }

  public async getAddress(): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.address
  }

  ////////////////////////
  // Creating Instances //
  ////////////////////////

  /**
   * Creates a new account with wallet of type `WALLET_TYPE_ETHERS`.
   */
  public async createAccount(): Promise<UserObject<EthersWalletSchema>> {
    const walletFromEthers = ethers.Wallet.createRandom()
    return {
      address: await walletFromEthers.getAddress(),
      wallet: this.getEthersWallet(walletFromEthers)
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
    return true
  }

  /**
   * Create a serialized wallet following the current format from an encryptedKeystore.
   * Can be used to migrate from serialized wallet version 0 to serialized wallet version 2.
   * @param encryptedKeystore Standard serialized encrypted JSON keystore.
   */
  public serializeWallet(encryptedKeystore: string): string {
    const deserializedWallet: EncryptedTLWalletSchema = {
      TLWalletVersion: TL_WALLET_VERSION,
      walletType: WALLET_TYPE_ETHERS,
      meta: {
        ethersKeystore: encryptedKeystore
      }
    }
    const serializedWallet = JSON.stringify(deserializedWallet)
    return serializedWallet
  }

  /**
   * Encrypts and serializes the given wallet.
   * @param ethersWallet `TLWallet` of type `WALLET_TYPE_ETHERS`.
   * @param password Password to encrypt wallet with.
   * @param progressCallback Optional encryption progress callback.
   */
  public async encryptWallet(
    ethersWallet: EthersWalletSchema,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<string> {
    const walletFromEthers = ethersWallet.meta.walletFromEthers
    const encryptedKeystore = await walletFromEthers.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    return this.serializeWallet(encryptedKeystore)
  }

  /**
   * Loads given ethers wallet.
   * @param ethersWallet `TLWallet` of type `WALLET_TYPE_ETHERS`.
   */
  public async loadAccount(ethersWallet: EthersWalletSchema): Promise<void> {
    this.walletFromEthers = ethersWallet.meta.walletFromEthers
  }

  /**
   * Recovers wallet from a serialized encrypted `TLWallet` or standard JSON keystore
   * string (e.g. as returned by `ethers.Wallet.encrypt`).
   * @param serializedEncryptedWallet Serialized `TLWallet` or standard JSON keystore.
   * @param password Password to decrypt serialized wallet with.
   * @param progressCallback Callback function for decryption progress.
   */
  public async recoverFromEncryptedWallet(
    serializedEncryptedWallet: string,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<UserObject<EthersWalletSchema>> {
    const deserializedWallet = JSON.parse(serializedEncryptedWallet)

    let encryptedKeystore: string

    if (!this.correctWalletType(deserializedWallet)) {
      throw new Error(
        `The serialized wallet given is of the wrong wallet type: ${
          deserializedWallet.walletType
        }`
      )
    }

    if (!('TLWalletVersion' in deserializedWallet)) {
      // Use the old serializing method if no TL_WALLET_VERSION key in the deserialized wallet
      encryptedKeystore = serializedEncryptedWallet
    } else if (deserializedWallet.TLWalletVersion === 1) {
      encryptedKeystore = deserializedWallet.ethersKeystore
    } else if (deserializedWallet.TLWalletVersion === 2) {
      encryptedKeystore = deserializedWallet.meta.ethersKeystore
    } else {
      throw new Error(
        `serialized wallet version is not handled: version ${
          deserializedWallet.TLWalletVersion
        }`
      )
    }

    const walletFromEthers = await ethers.Wallet.fromEncryptedJson(
      encryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    return {
      address: await walletFromEthers.getAddress(),
      wallet: this.getEthersWallet(walletFromEthers)
    }
  }

  /**
   * Recovers wallet from mnemonic phrase.
   * @param seed Mnemonic seed phrase.
   */
  public async recoverFromSeed(
    seed: string
  ): Promise<UserObject<EthersWalletSchema>> {
    const walletFromEthers = ethers.Wallet.fromMnemonic(seed)
    return {
      address: await walletFromEthers.getAddress(),
      wallet: this.getEthersWallet(walletFromEthers)
    }
  }

  /**
   * Recovers wallet from private key.
   * Note that mnemonic is `undefined` here.
   * @param privateKey Private key to recover wallet from.
   */
  public async recoverFromPrivateKey(
    privateKey: string
  ): Promise<UserObject<EthersWalletSchema>> {
    const walletFromEthers = new ethers.Wallet(privateKey)
    return {
      address: await walletFromEthers.getAddress(),
      wallet: this.getEthersWallet(walletFromEthers)
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
    if (!this.walletFromEthers) {
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
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    const flatFormatSignature = await this.walletFromEthers.signMessage(message)
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
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    const signedTransaction = await this.walletFromEthers.sign({
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
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    const balance = await this.provider.fetchEndpoint<string>(
      `users/${this.address}/balance`
    )
    return utils.formatToAmount(utils.calcRaw(balance, 18), 18)
  }

  /**
   * Returns a `Promise` with the mnemonic seed phrase of loaded user.
   * Note that the returned seed is `undefined` for accounts recovered by a private key
   * or serialized encrypted keystores that were not created with `ethers`.
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

  private getEthersWallet(walletFromEthers: ethers.Wallet): EthersWalletSchema {
    return {
      TLWalletVersion: TL_WALLET_VERSION,
      walletType: WALLET_TYPE_ETHERS,
      meta: { walletFromEthers }
    }
  }
}
