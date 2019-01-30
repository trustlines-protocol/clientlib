import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { TLSigner } from './TLSigner'

import { Signature, UserObject } from '../typings'

/**
 * The LightwalletSigner class contains functions for signing transactions with eth-lightwallet.
 */
export class RelaySigner implements TLSigner {
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

  public get mnemonic(): string {
    return this.wallet ? this.wallet.mnemonic : undefined
  }

  public get privateKey(): string {
    return this.wallet ? this.wallet.privateKey : undefined
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
    return this.provider.sendTransaction(signedTransaction)
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
