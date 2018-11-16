import { TxSigner } from './TxSigner'

import {
  TxInfos,
  RawTxObject,
  Web3TxReceipt,
  UserObject,
  Signature,
  Amount
} from '../typings'

import { BigNumber } from 'bignumber.js'

/**
 * The Web3Signer class contains functions for signing transactions with a web3 provider.
 */
export class Web3Signer implements TxSigner {
  public address: string
  public pubKey: string
  private _web3: any

  constructor(web3: any) {
    this._web3 = web3
  }

  /**
   * Signs a transaction using the web3 provider.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    const { functionCallData } = rawTx
    if (rawTx.functionCallData) {
      rawTx = {
        ...rawTx,
        data: this._encodeFunctionCall(
          functionCallData.abi,
          functionCallData.functionName,
          functionCallData.args
        )
      }
    }
    const { transactionHash } = await this._web3.eth.sendTransaction({
      ...rawTx,
      gas: new BigNumber(rawTx.gasLimit).toNumber()
    })
    return transactionHash
  }

  /**
   * Returns needed information for creating an ethereum transaction.
   * @param userAddress address of user creating the transaction
   * @returns Information for creating an ethereum transaction for the given user address.
   *          See type `TxInfos` for more details.
   */
  public async getTxInfos(userAddress: string): Promise<TxInfos> {
    const [gasPrice, nonce, balance] = await Promise.all([
      this._web3.eth.getGasPrice(),
      this._web3.eth.getTransactionCount(userAddress),
      this._web3.eth.getBalance(userAddress)
    ])
    return {
      nonce,
      gasPrice: new BigNumber(gasPrice),
      balance: new BigNumber(balance)
    }
  }

  /**
   * TODO
   */
  public async createAccount(): Promise<UserObject> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  public async loadAccount(): Promise<UserObject> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  public async signMsgHash(): Promise<Signature> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  getBalance(): Promise<Amount> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  encrypt(): Promise<any> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  decrypt(): Promise<any> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  showSeed(): Promise<string> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  recoverFromSeed(): Promise<UserObject> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  exportPrivateKey(): Promise<string> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * Encode function call data to a ABI byte string.
   * @param abi JSON ABI of contract.
   * @param functionName Name of contract function to call.
   * @param args Function arguments.
   */
  private _encodeFunctionCall(
    abi: any[],
    functionName: string,
    args: string[]
  ): string {
    const [functionAbi] = abi.filter(({ name }) => name === functionName)
    return this._web3.eth.abi.encodeFunctionCall(functionAbi, args)
  }
}
