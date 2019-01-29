import { ethers } from 'ethers'

import { RelayProvider } from '../providers/RelayProvider'
import { Utils } from '../Utils'
import { TLSigner } from './TLSigner'

import { Signature, UserObject } from '../typings'

/**
 * The LightwalletSigner class contains functions for signing transactions with eth-lightwallet.
 */
export class RelaySigner implements TLSigner {
  public provider: RelayProvider

  private utils: Utils
  private wallet: ethers.Wallet

  constructor(provider: RelayProvider, utils: Utils) {
    this.provider = provider
    this.utils = utils
  }

  ///////////////
  // Accessors //
  ///////////////

  public get address(): string {
    return this.wallet ? this.wallet.address : null
  }

  public get pubKey(): string {
    return this.wallet
      ? ethers.utils.computePublicKey(this.wallet.privateKey)
      : null
  }

  public get mnemonic(): string {
    return this.wallet ? this.wallet.mnemonic : null
  }

  public get privateKey(): string {
    return this.wallet ? this.wallet.privateKey : null
  }

  public async getAddress(): Promise<string> {
    return this.address
  }

  ////////////////////////
  // Creating Instances //
  ////////////////////////

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

  public async signMsgHash(msgHash: string): Promise<Signature> {
    const binaryData = ethers.utils.arrayify(msgHash)
    const flatFormatSignature = await this.wallet.signMessage(binaryData)
    const { r, s, v } = ethers.utils.splitSignature(flatFormatSignature)
    return {
      concatSig: flatFormatSignature,
      ecSignature: { r, s, v }
    }
  }

  public async signMessage(message: ethers.utils.Arrayish): Promise<string> {
    return this.wallet.signMessage(message)
  }

  ///////////////////////////
  // Blockchain Operations //
  ///////////////////////////

  public async sendTransaction(
    transaction: ethers.providers.TransactionRequest
  ): Promise<ethers.providers.TransactionResponse> {
    const signedTransaction = await this.wallet.sign({
      data: transaction.data,
      gasLimit: transaction.gasLimit,
      gasPrice: transaction.gasPrice,
      nonce: transaction.nonce,
      to: transaction.to,
      value: transaction.value
    })
    const { r, s, v } = ethers.utils.parseTransaction(signedTransaction)
    const txHash = await this._relayTx(signedTransaction)
    return {
      chainId: undefined,
      confirmations: undefined,
      data: transaction.data as string,
      from: transaction.from as string,
      gasLimit: transaction.gasLimit as ethers.utils.BigNumber,
      gasPrice: transaction.gasPrice as ethers.utils.BigNumber,
      hash: txHash,
      nonce: transaction.nonce as number,
      r,
      raw: signedTransaction,
      s,
      to: transaction.to as string,
      v,
      value: transaction.value as ethers.utils.BigNumber,
      wait: async () => {
        throw new Error('Method not implemented.')
      }
    }
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

  ///////////////////
  // Relay Helpers //
  ///////////////////

  /**
   * Relays signed rlp encoded transaction.
   * @param signedTx Signed RLP encoded ethereum transaction.
   */
  private async _relayTx(signedTx: string): Promise<string> {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const options = {
      body: JSON.stringify({ rawTransaction: signedTx }),
      headers,
      method: 'POST'
    }
    return this.utils.fetchUrl<string>(
      `${this.provider.relayApiUrl}/relay`,
      options
    )
  }

  ///////////////
  // Exception //
  ///////////////
  private _assertWalletInitialized() {
    if (!this.wallet) {
      throw new Error('No wallet initialized.')
    }
    return
  }
}
