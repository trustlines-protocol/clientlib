import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import {
  EXPECTED_VERSIONS,
  TLWallet,
  verifyWalletData,
  WALLET_TYPE_ETHERS,
  walletDataToWalletFromEthers,
  walletFromEthersToWalletData
} from './TLWallet'

import utils from '../utils'

import {
  Amount,
  EthersWalletData,
  RawTxObject,
  Signature,
  TxInfos
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

  public async getAddress(): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.address
  }

  public async getWalletData(): Promise<EthersWalletData> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.walletFromEthersToEthersWalletData(this.walletFromEthers)
  }

  ////////////////////////
  // Creating Instances //
  ////////////////////////

  /**
   * Creates wallet data of type `ethers`.
   */
  public async create(): Promise<EthersWalletData> {
    const walletFromEthers = ethers.Wallet.createRandom()
    return this.walletFromEthersToEthersWalletData(walletFromEthers)
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
   * Encrypts and serializes the given wallet data.
   * @param walletData Wallet data of type `ethers`.
   * @param password Password to encrypt wallet data with.
   * @param progressCallback Optional encryption progress callback.
   * @returns Serialized encrypted ethereum JSON keystore v3.
   */
  public async encryptToSerializedKeystore(
    walletData: EthersWalletData,
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
   * Loads given wallet data of type `ethers`.
   * @param walletData Wallet data of type `ethers`.
   */
  public async loadFrom(walletData: EthersWalletData): Promise<void> {
    verifyWalletData(walletData, WALLET_TYPE_ETHERS, EXPECTED_VERSIONS)
    this.walletFromEthers = walletDataToWalletFromEthers(walletData)
  }

  /**
   * Recovers wallet data from a serialized encrypted ethereum JSON keystore v3
   * (e.g. as returned by `encryptToSerializedKeystore`).
   * @param serializedEncryptedKeystore Serialized encrypted ethereum JSON keystore v3.
   * @param password Password to decrypt encrypted ethereum JSON keystore v3.
   * @param progressCallback Callback function for decryption progress.
   */
  public async recoverFromEncryptedKeystore(
    serializedEncryptedKeystore: string,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<EthersWalletData> {
    const walletFromEthers = await ethers.Wallet.fromEncryptedJson(
      serializedEncryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    return this.walletFromEthersToEthersWalletData(walletFromEthers)
  }

  /**
   * Recovers wallet data from mnemonic phrase.
   * @param seed Mnemonic seed phrase.
   */
  public async recoverFromSeed(seed: string): Promise<EthersWalletData> {
    const walletFromEthers = ethers.Wallet.fromMnemonic(seed)
    return this.walletFromEthersToEthersWalletData(walletFromEthers)
  }

  /**
   * Recovers wallet data from private key.
   * Note that mnemonic and derivation path is `undefined` here.
   * @param privateKey Private key to recover wallet data from.
   */
  public async recoverFromPrivateKey(
    privateKey: string
  ): Promise<EthersWalletData> {
    const walletFromEthers = new ethers.Wallet(privateKey)
    return this.walletFromEthersToEthersWalletData(walletFromEthers)
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

  private walletFromEthersToEthersWalletData(
    walletFromEthers: ethers.Wallet
  ): EthersWalletData {
    const walletData = walletFromEthersToWalletData(
      walletFromEthers,
      WALLET_TYPE_ETHERS,
      walletFromEthers.address
    )
    return walletData as EthersWalletData
  }
}
