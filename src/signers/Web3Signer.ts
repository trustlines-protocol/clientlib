import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { TLSigner } from './TLSigner'

import * as utils from '../utils'

import { Amount, RawTxObject, Signature } from '../typings'

/**
 * The Web3Signer class contains functions for signing transactions with a web3 provider.
 */
export class Web3Signer implements TLSigner {
  public address: string
  public pubKey: string

  private signer: ethers.providers.JsonRpcSigner

  constructor(web3Provider: any) {
    const provider = new ethers.providers.Web3Provider(web3Provider)
    this.signer = provider.getSigner()
  }

  /**
   * Returns `Promise` with address of signer.
   */
  public async getAddress(): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer set.')
    }
    return this.signer.getAddress()
  }

  /**
   * Returns `Promise` with balance of signer.
   */
  public async getBalance(): Promise<Amount> {
    if (!this.signer) {
      throw new Error('No signer set.')
    }
    const balance = (await this.signer.getBalance()).toString()
    return {
      decimals: 18,
      raw: balance,
      value: utils.calcValue(balance, 18).toString()
    }
  }

  /**
   * Signs a transaction and returns `Promise` with transaction hash.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    if (!this.signer) {
      throw new Error('No signer set.')
    }
    const { hash } = await this.signer.sendTransaction({
      ...rawTx,
      gasLimit: rawTx.gasLimit && new BigNumber(rawTx.gasLimit).toString(),
      gasPrice: rawTx.gasPrice && new BigNumber(rawTx.gasPrice).toString(),
      value: rawTx.value && new BigNumber(rawTx.value).toString()
    })
    return hash
  }

  /**
   * Signs the given message and returns `Promise` with signature.
   * @param message Message to sign.
   */
  public async signMessage(
    message: string | ArrayLike<number>
  ): Promise<Signature> {
    if (!this.signer) {
      throw new Error('No signer set.')
    }
    const flatSignature = await this.signer.signMessage(message)
    const { r, s, v } = ethers.utils.splitSignature(flatSignature)
    return {
      concatSig: flatSignature,
      ecSignature: { r, s, v }
    }
  }

  /**
   * Signs the given message hash and return `Promise` with signature.
   * @param msgHash Hash of message to sign.
   */
  public async signMsgHash(msgHash: string): Promise<Signature> {
    if (!this.signer) {
      throw new Error('No signer set.')
    }
    if (!ethers.utils.isHexString(msgHash)) {
      throw new Error('Message hash is not a valid hex string.')
    }
    const msgHashBytes = ethers.utils.arrayify(msgHash)
    return this.signMessage(msgHashBytes)
  }
}
