import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { TLSigner } from './TLSigner'

import * as utils from '../utils'

import {
  Amount,
  MetaTransactionFees,
  RawTxObject,
  Signature,
  TransactionStatusObject,
  TxInfos,
  TxObjectRaw
} from '../typings'

/**
 * The Web3Signer class contains functions for signing transactions with a web3 provider.
 */
export class Web3Signer implements TLSigner {
  private signer: ethers.providers.JsonRpcSigner
  private web3Provider: ethers.providers.Web3Provider

  constructor(web3Provider: ethers.providers.Web3Provider) {
    this.web3Provider = web3Provider
    this.signer = web3Provider.getSigner()
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

  /**
   * Returns the hash of the signed transaction for given rawTx with loaded user
   * @param rawTx
   */
  public async hashTx(rawTx: RawTxObject): Promise<string> {
    throw new Error('Not implemented yet.')
  }

  public async getTxInfos(userAddress: string): Promise<TxInfos> {
    // The bigNumber returned from ethers is not the same one we use in TxInfos
    // I get strings and convert them to BigNumber later
    const balanceString: string = (
      await this.web3Provider.getBalance(userAddress)
    ).toString()
    const nonce: number = await this.web3Provider.getTransactionCount(
      userAddress
    )
    const gasPriceString: string = (
      await this.web3Provider.getGasPrice()
    ).toString()

    const gasPrice = new BigNumber(gasPriceString)
    const balance = new BigNumber(balanceString)

    return { balance, gasPrice, nonce }
  }

  public async prepareTransaction(rawTx: RawTxObject): Promise<TxObjectRaw> {
    const signerAddress = await this.getAddress()
    const { gasPrice, nonce } = await this.getTxInfos(signerAddress)

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
    throw new Error('Not implemented yet.')
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
