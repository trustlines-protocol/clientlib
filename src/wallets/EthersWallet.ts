import { BigNumber } from 'bignumber.js'
import { utils as ethersUtils } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import {
  EXPECTED_VERSIONS,
  TLWallet,
  verifyWalletData,
  WALLET_TYPE_ETHERS
} from './TLWallet'
import { WalletFromEthers } from './WalletFromEthers'

import utils from '../utils'

import {
  Amount,
  EthersWalletData,
  MetaTransactionFees,
  RawTxObject,
  Signature,
  TransactionStatusObject,
  TxObjectRaw
} from '../typings'

/**
 * The EthersWallet class contains wallet related methods.
 */
export class EthersWallet implements TLWallet {
  public provider: TLProvider

  private walletFromEthers: WalletFromEthers

  constructor(provider: TLProvider) {
    this.provider = provider
  }

  ///////////////
  // Accessors //
  ///////////////

  // The address function is a convenient way to access to address in a synchronous method
  public get address(): string {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.walletFromEthers.address
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
    return this.walletFromEthers.toEthersWalletData()
  }

  ////////////////////////
  // Creating Instances //
  ////////////////////////

  /**
   * Creates wallet data of type `ethers`.
   */
  public async create(): Promise<EthersWalletData> {
    const walletFromEthers = WalletFromEthers.createRandom()
    return walletFromEthers.toEthersWalletData()
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
    const walletFromEthers = WalletFromEthers.fromWalletData(walletData)
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
    this.walletFromEthers = WalletFromEthers.fromWalletData(walletData)
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
    const walletFromEthers = await WalletFromEthers.fromEncryptedJson(
      serializedEncryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )
    return walletFromEthers.toEthersWalletData()
  }

  /**
   * Recovers wallet data from mnemonic phrase.
   * @param seed Mnemonic seed phrase.
   */
  public async recoverFromSeed(seed: string): Promise<EthersWalletData> {
    const walletFromEthers = WalletFromEthers.fromMnemonic(seed)
    return walletFromEthers.toEthersWalletData()
  }

  /**
   * Recovers wallet data from private key.
   * Note that mnemonic and derivation path is `undefined` here.
   * @param privateKey Private key to recover wallet data from.
   */
  public async recoverFromPrivateKey(
    privateKey: string
  ): Promise<EthersWalletData> {
    const walletFromEthers = new WalletFromEthers(privateKey)
    return walletFromEthers.toEthersWalletData()
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
    if (!ethersUtils.isHexString(msgHash)) {
      throw new Error('Message hash is not a valid hex string.')
    }
    const msgHashBytes = ethersUtils.arrayify(msgHash)
    return this.signMessage(msgHashBytes)
  }

  /**
   * Signs given message with loaded wallet.
   * @param message Message to sign.
   */
  public async signMessage(message: ethersUtils.Arrayish): Promise<Signature> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    const flatFormatSignature = await this.walletFromEthers.signMessage(message)
    const { r, s, v } = ethersUtils.splitSignature(flatFormatSignature)
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
    const signedTransaction = await this.signTx(rawTx)
    return this.provider.sendSignedTransaction(signedTransaction)
  }

  /**
   * Takes a raw transaction object and signs it RLP encoded with the loaded user
   * @param rawTx
   */
  public async signTx(rawTx: RawTxObject): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return this.walletFromEthers.sign({
      data: rawTx.data,
      gasLimit: ethersUtils.bigNumberify(
        rawTx.gasLimit instanceof BigNumber
          ? rawTx.gasLimit.toString()
          : rawTx.gasLimit
      ),
      gasPrice: ethersUtils.bigNumberify(
        rawTx.gasPrice instanceof BigNumber
          ? rawTx.gasPrice.toString()
          : rawTx.gasPrice
      ),
      nonce: rawTx.nonce,
      to: rawTx.to,
      value: ethersUtils.bigNumberify(
        rawTx.value instanceof BigNumber ? rawTx.value.toString() : rawTx.value
      )
    })
  }

  /**
   * Returns the hash of the signed transaction for given rawTx with loaded user
   * @param rawTx
   */
  public async hashTx(rawTx: RawTxObject): Promise<string> {
    if (!this.walletFromEthers) {
      throw new Error('No wallet loaded.')
    }
    return ethersUtils.keccak256(await this.signTx(rawTx))
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
    return this.provider.getBalance(this.address)
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

  public async prepareTransaction(rawTx: RawTxObject): Promise<TxObjectRaw> {
    const { gasPrice, nonce } = await this.provider.getTxInfos(this.address)

    rawTx.gasPrice = rawTx.gasPrice || gasPrice
    rawTx.baseFee = new BigNumber(0)
    rawTx.totalFee = new BigNumber(rawTx.gasPrice).multipliedBy(rawTx.gasLimit)
    rawTx.nonce = nonce

    const txFees = {
      gasPrice: rawTx.gasPrice,
      gasLimit: rawTx.gasLimit,
      baseFee: rawTx.baseFee,
      totalFee: rawTx.totalFee
    }

    return {
      rawTx,
      txFees
    }
  }

  public async getTxStatus(
    tx: string | RawTxObject
  ): Promise<TransactionStatusObject> {
    const txHash = typeof tx === 'string' ? tx : await this.hashTx(tx)
    return this.provider.getTxStatus(txHash)
  }

  public async getMetaTxFees(rawTx: RawTxObject): Promise<MetaTransactionFees> {
    return {
      baseFee: '0',
      gasPrice: '0',
      feeRecipient: '',
      currencyNetworkOfFees: ''
    }
  }
}
