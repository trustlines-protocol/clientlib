import { Utils } from './Utils'
import { TxObject, TxOptions, TxInfos } from './typings'

import * as lightwallet from 'eth-lightwallet'
// declare let lightwallet
import * as ethUtils from 'ethereumjs-util'

/**
 * Contract ABIs
 */
const CONTRACTS = require('../contracts.json')

/**
 * The Transaction class contains functions that are needed for Ethereum transactions.
 */
export class Transaction {
  private _utils: Utils

  constructor (utils: Utils) {
    this._utils = utils
  }

  /**
   * Returns transaction fees and the raw transaction for calling a contract function.
   * @param userAddress address of user that calls the contract function
   * @param contractAddress address of deployed contract
   * @param contractName name of deployed contract
   * @param functionName name of contract function
   * @param parameters arguments of function in same order as in contract
   * @param gasPrice (optional)
   * @param gasLimit (optional)
   */
  public async prepFuncTx (
    userAddress: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    parameters: any[],
    { gasPrice, gasLimit }: TxOptions = {}
  ): Promise<TxObject> {
    try {
      const txInfos = await this._getTxInfos(userAddress)
      const txOptions = {
        gasPrice: gasPrice || txInfos.gasPrice,
        gasLimit: gasLimit || 600000,
        value: 0,
        nonce: txInfos.nonce,
        to: contractAddress.toLowerCase()
      }
      const txObj = {
        rawTx: lightwallet.txutils.functionTx(
          CONTRACTS[ contractName ].abi, functionName, parameters, txOptions
        ),
        ethFees: this._utils.formatAmount(
          txOptions.gasLimit * txOptions.gasPrice, 18
        )
      }
      return txObj
    } catch (error) {
      this._handleError(error)
    }
  }

  /**
   * Returns transaction fees and raw transaction for transferring ETH.
   * @param from address of user sending the transfer
   * @param to address of user receiving the transfer
   * @param rawValue transfer amount in wei
   * @param gasPrice (optional)
   * @param gasLimit (optional)
   */
  public async prepValueTx (
    from: string,
    to: string,
    rawValue: number,
    { gasPrice, gasLimit }: TxOptions = {}
  ): Promise<TxObject> {
    try {
      const txInfos = await this._getTxInfos(from)
      const txOptions = {
        gasPrice: gasPrice || txInfos.gasPrice,
        gasLimit: gasLimit || 21000,
        value: rawValue,
        nonce: txInfos.nonce,
        to: to.toLowerCase()
      }
      const txObj = {
        rawTx: lightwallet.txutils.valueTx(txOptions),
        ethFees: this._utils.formatAmount(
          txOptions.gasLimit * txOptions.gasPrice, 18
        )
      }
      return txObj
    } catch (error) {
      this._handleError(error)
    }
  }

  /**
   * Relays signed raw transactions.
   * @param signedRawTx signed raw transaction
   */
  public relayTx (signedRawTx: string): Promise<any> {
    const headers = new Headers({'Content-Type': 'application/json'})
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify({rawTransaction: `0x${signedRawTx}`})
    }
    return this._utils.fetchUrl('relay', options)
  }

  /**
   * Returns the latest block number.
   */
  public getBlockNumber (): Promise<number> {
    return this._utils.fetchUrl('blocknumber')
  }

  /**
   * Returns needed information for creating a transaction.
   * @param userAddress address of user creating the transaction
   */
  private _getTxInfos (userAddress: string): Promise<TxInfos> {
    return this._utils.fetchUrl(`users/${userAddress}/txinfos`)
  }

  /**
   * Reject Promise and return error message if exists.
   * @param error error object
   */
  private _handleError (error: any) {
    return Promise.reject(error.json().message || error)
  }
}
