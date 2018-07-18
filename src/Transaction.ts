import { Utils } from './Utils'
import { TxInterface } from './strategies/TxInterface'
import {
  TxOptionsInternal,
  TxObjectInternal,
  RawTxObject
} from './typings'

import { BigNumber } from 'bignumber.js'

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
  private _strategy: TxInterface

  constructor (
    utils: Utils,
    strategy: TxInterface
  ) {
    this._utils = utils
    this._strategy = strategy
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
    args: any[],
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    const { gasPrice, nonce } = await this._strategy.getTxInfos(userAddress)
    const rawTx = {
      gasPrice: options.gasPrice || gasPrice,
      gasLimit: options.gasLimit || new BigNumber(600000),
      value: options.value || new BigNumber(0),
      nonce: nonce,
      to: contractAddress.toLowerCase(),
      from: userAddress,
      functionCallData: {
        abi: CONTRACTS[ contractName ].abi,
        functionName,
        args
      }
    }
    const ethFees = rawTx.gasLimit.multipliedBy(rawTx.gasPrice)
    return {
      rawTx,
      ethFees: this._utils.formatToAmountInternal(ethFees, ETH_DECIMALS)
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
    rawValue: BigNumber,
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    const txInfos = await this._strategy.getTxInfos(senderAddress)
    const rawTx = {
      gasPrice: options.gasPrice || txInfos.gasPrice,
      gasLimit: options.gasLimit || new BigNumber(21000),
      value: rawValue,
      nonce: txInfos.nonce,
      to: receiverAddress.toLowerCase(),
      from: senderAddress
    }
    const ethFees = rawTx.gasLimit.multipliedBy(rawTx.gasPrice)
    return {
      rawTx,
      ethFees: this._utils.formatToAmountInternal(ethFees, ETH_DECIMALS)
    }
  }

  public async confirm (rawTx: RawTxObject): Promise<any> {
    return this._strategy.confirm(rawTx)
  }

  /**
   * Returns the latest block number of the underlying blockchain.
   */
  public getBlockNumber (): Promise<number> {
    return this._utils.fetchUrl<number>('blocknumber')
  }

  public setStrategy (strategy: TxInterface) {
    this._strategy = strategy
  }
}
