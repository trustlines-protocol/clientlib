import { BigNumber } from 'bignumber.js'

import { TxSigner } from './TxSigner'

import { Amount, RawTxObject, Signature, TxInfos, UserObject } from '../typings'

/**
 * The Web3Signer class contains functions for signing transactions with a web3 provider.
 */
export class Web3Signer implements TxSigner {
  public address: string
  public pubKey: string

  private web3: any

  constructor(web3: any) {
    this.web3 = web3
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
    const { transactionHash } = await this.web3.eth.sendTransaction({
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
      this.web3.eth.getGasPrice(),
      this.web3.eth.getTransactionCount(userAddress),
      this.web3.eth.getBalance(userAddress)
    ])
    return {
      balance: new BigNumber(balance),
      gasPrice: new BigNumber(gasPrice),
      nonce
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
  public async getBalance(): Promise<Amount> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  public encrypt(): Promise<any> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  public decrypt(): Promise<any> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  public showSeed(): Promise<string> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  public recoverFromSeed(): Promise<UserObject> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  /**
   * TODO
   */
  public exportPrivateKey(): Promise<string> {
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
    return this.web3.eth.abi.encodeFunctionCall(functionAbi, args)
  }
}
