import { Utils } from './Utils'
import {
  TxObject,
  TxOptions,
  TxInfos,
  TxInfosRaw,
  TxOptionsInternal,
  TxObjectInternal,
  SignedTxObject
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
  private _web3: any

  constructor (
    utils: Utils,
    web3: any
  ) {
    this._utils = utils
    this._web3 = web3
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
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    const txInfos = await this._getTxInfos(userAddress)
    const web3Tx = {
      gasPrice: options.gasPrice || txInfos.gasPrice,
      gasLimit: options.gasLimit || new BigNumber(600000),
      value: options.value || new BigNumber(0),
      nonce: txInfos.nonce,
      to: contractAddress.toLowerCase(),
      from: userAddress,
      data: this._encodeFunctionCall(
        CONTRACTS[ contractName ].abi,
        functionName,
        parameters
      )
    }
    const ethFees = web3Tx.gasLimit.multipliedBy(web3Tx.gasPrice)
    return {
      web3Tx,
      rawTx: lightwallet.txutils.functionTx(
        CONTRACTS[ contractName ].abi,
        functionName,
        parameters,
        {
          ...web3Tx,
          gasPrice: this._utils.convertToHexString(web3Tx.gasPrice),
          gasLimit: this._utils.convertToHexString(web3Tx.gasLimit),
          value: this._utils.convertToHexString(web3Tx.value)
        }
      ),
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
    const txInfos = await this._getTxInfos(senderAddress)
    const web3Tx = {
      gasPrice: options.gasPrice || txInfos.gasPrice,
      gasLimit: options.gasLimit || new BigNumber(21000),
      value: rawValue,
      nonce: txInfos.nonce,
      to: receiverAddress.toLowerCase(),
      from: senderAddress
    }
    const ethFees = web3Tx.gasLimit.multipliedBy(web3Tx.gasPrice)
    return {
      web3Tx,
      rawTx: lightwallet.txutils.valueTx({
        ...web3Tx,
        gasPrice: this._utils.convertToHexString(web3Tx.gasPrice),
        gasLimit: this._utils.convertToHexString(web3Tx.gasLimit),
        value: this._utils.convertToHexString(web3Tx.value)
      }),
      ethFees: this._utils.formatToAmountInternal(ethFees, ETH_DECIMALS)
    }
  }

  public async confirm (signedTxObject: SignedTxObject): Promise<any> {
    const { web3Tx, signedTx } = signedTxObject
    if (this._web3.currentProvider) {
      return this._web3.eth.sendTransaction(web3Tx)
    } else {
      return this.relayTx(signedTx)
    }
  }

  /**
   * Relays signed raw transactions.
   * @param signedTx signed ethereum transaction
   */
  public relayTx (signedTx: string): Promise<string> {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify({ rawTransaction: `0x${signedTx}` })
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
    let txInfos

    if (this._web3.currentProvider) {
      const [ gasPrice, nonce, balance ] = await Promise.all([
        this._web3.eth.getGasPrice(),
        this._web3.eth.getTransactionCount(userAddress),
        this._web3.eth.getBalance(userAddress)
      ])
      txInfos = { gasPrice, nonce, balance }
    } else {
      txInfos = await this._utils.fetchUrl<TxInfosRaw>(`users/${userAddress}/txinfos`)
    }

    console.log(txInfos)
    return {
      ...txInfos,
      gasPrice: new BigNumber(txInfos.gasPrice),
      balance: new BigNumber(txInfos.balance)
    }
  }

  private _encodeFunctionCall (
    abi: any,
    functionName: string,
    parameters: string[]
  ): string {
    const [ functionAbi ] = abi.filter(({ name }) => name === functionName)
    return this._web3.eth._encodeFunctionCall(functionAbi, parameters)
  }
}
