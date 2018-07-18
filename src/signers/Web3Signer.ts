
import { TxSigner } from './TxSigner'

import { TxInfos, RawTxObject } from '../typings'

import { BigNumber } from 'bignumber.js'

/**
 * The Transaction class contains functions that are needed for Ethereum transactions.
 */
export class Web3Signer implements TxSigner {
  private _web3: any

  constructor (web3: any) {
    this._web3 = web3
  }

  /**
   * Signs a transaction using the web3 provider.
   * @param rawTx Raw transaction object.
   */
  public async confirm (rawTx: RawTxObject): Promise<string> {
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
    return this._web3.eth.sendTransaction({
      ...rawTx,
      gas: new BigNumber(rawTx.gasLimit).toNumber()
    })
  }

  /**
   * Returns needed information for creating an ethereum transaction.
   * @param userAddress address of user creating the transaction
   * @returns Information for creating an ethereum transaction for the given user address.
   *          See tyoe `TxInfos` for more details.
   */
  public async getTxInfos (userAddress: string): Promise<TxInfos> {
    const [ gasPrice, nonce, balance ] = await Promise.all([
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

  private _encodeFunctionCall (
    abi: any,
    functionName: string,
    parameters: string[]
  ): string {
    const [ functionAbi ] = abi.filter(({ name }) => name === functionName)
    return this._web3.eth.abi.encodeFunctionCall(functionAbi, parameters)
  }
}
