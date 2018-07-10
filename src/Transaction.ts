import { Utils } from './Utils'
import {
  TxObject,
  TxOptions,
  TxInfos,
  TxInfosRaw,
  RawTxOptions
} from './typings'

import { BigNumber } from 'bignumber.js'
import * as lightwallet from 'eth-lightwallet'
// declare let lightwallet

/**
 * Contract ABIs
 */
const CONTRACTS = require('../contracts.json')
const ETH_DECIMALS = 18

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
   * @returns A ethereum transaction object containing the RLP encoded hex string of the
   *          transaction and the estimated transaction fees in ETH.
   */
  public async prepFuncTx (
    userAddress: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    parameters: any[],
    options: RawTxOptions = {}
  ): Promise<TxObject> {
    const txInfos = await this._getTxInfos(userAddress)
    const txOptions = {
      gasPrice: options.gasPrice || txInfos.gasPrice,
      gasLimit: options.gasLimit || new BigNumber(600000),
      value: options.value || new BigNumber(0),
      nonce: txInfos.nonce,
      to: contractAddress.toLowerCase()
    }
    const ethFees = txOptions.gasLimit.multipliedBy(txOptions.gasPrice)
    return {
      rawTx: lightwallet.txutils.functionTx(
        CONTRACTS[ contractName ].abi, functionName, parameters, {
          ...txOptions,
          gasPrice: this._utils.convertDecToHex(txOptions.gasPrice),
          gasLimit: this._utils.convertDecToHex(txOptions.gasLimit),
          value: this._utils.convertDecToHex(txOptions.value)
        }
      ),
      ethFees: this._utils.formatAmount(ethFees, ETH_DECIMALS)
    }
  }

  /**
   * Returns transaction fees and raw transaction for transferring ETH.
   * @param senderAddress address of user sending the transfer
   * @param receiverAddress address of user receiving the transfer
   * @param rawValue transfer amount in wei
   * @param gasPrice (optional)
   * @param gasLimit (optional)
   * @returns A ethereum transaction object containing the RLP encoded hex string of the
   *          transaction and the estimated transaction fees in ETH.
   */
  public async prepValueTx (
    senderAddress: string,
    receiverAddress: string,
    rawValue: string,
    options: RawTxOptions = {}
  ): Promise<TxObject> {
    const txInfos = await this._getTxInfos(senderAddress)
    const txOptions = {
      gasPrice: options.gasPrice || txInfos.gasPrice,
      gasLimit: options.gasLimit || new BigNumber(21000),
      value: rawValue,
      nonce: txInfos.nonce,
      to: receiverAddress.toLowerCase()
    }
    const ethFees = txOptions.gasLimit.multipliedBy(txOptions.gasPrice)
    return {
      rawTx: lightwallet.txutils.valueTx({
        ...txOptions,
        gasPrice: this._utils.convertDecToHex(txOptions.gasPrice),
        gasLimit: this._utils.convertDecToHex(txOptions.gasLimit),
        value: this._utils.convertDecToHex(txOptions.value)
      }),
      ethFees: this._utils.formatAmount(ethFees, ETH_DECIMALS)
    }
  }

  /**
   * Relays signed raw transactions.
   * @param signedTx signed ethereum transaction
   */
  public relayTx (signedTx: string): Promise<string> {
    const headers = new Headers({'Content-Type': 'application/json'})
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify({rawTransaction: `0x${signedTx}`})
    }
    return this._utils.fetchUrl<string>('relay', options)
  }

  /**
   * Returns the latest block number of the underlying blockchain.
   */
  public getBlockNumber (): Promise<number> {
    return this._utils.fetchUrl<number>('blocknumber')
  }

  /**
   * Returns needed information for creating an ethereum transaction.
   * @param userAddress address of user creating the transaction
   * @returns Information for creating an ethereum transaction for the given user address.
   *          See tyoe `TxInfos` for more details.
   */
  private async _getTxInfos (userAddress: string): Promise<TxInfos> {
    const txInfos = await this._utils.fetchUrl<TxInfosRaw>(`users/${userAddress}/txinfos`)
    return {
      ...txInfos,
      gasPrice: new BigNumber(txInfos.gasPrice),
      balance: new BigNumber(txInfos.balance)
    }
  }
}
