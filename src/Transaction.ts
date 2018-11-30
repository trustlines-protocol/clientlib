import { BigNumber } from 'bignumber.js'

import { TxSigner } from './signers/TxSigner'
import { Utils } from './Utils'

import { RawTxObject, TxObjectInternal, TxOptionsInternal } from './typings'

/**
 * Contract ABIs
 */
// tslint:disable-next-line
const CONTRACTS = require('../contracts.json')
const ETH_DECIMALS = 18

/**
 * The Transaction class contains functions that are needed for Ethereum transactions.
 */
export class Transaction {
  private utils: Utils
  private signer: TxSigner

  constructor(utils: Utils, signer: TxSigner) {
    this.utils = utils
    this.signer = signer
  }

  /**
   * Returns transaction fees and the raw transaction object for calling a contract function.
   * @param userAddress address of user that calls the contract function
   * @param contractAddress address of deployed contract
   * @param contractName name of deployed contract
   * @param functionName name of contract function
   * @param parameters arguments of function in same order as in contract
   * @param gasPrice (optional)
   * @param gasLimit (optional)
   * @returns A ethereum transaction object and the estimated transaction fees in ETH.
   */
  public async prepFuncTx(
    userAddress: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    args: any[],
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    const { gasPrice, nonce } = await this.signer.getTxInfos(userAddress)
    const rawTx = {
      from: userAddress,
      functionCallData: {
        abi: CONTRACTS[contractName].abi,
        args,
        functionName
      },
      gasLimit: options.gasLimit || new BigNumber(600000),
      gasPrice: options.gasPrice || gasPrice,
      nonce,
      to: contractAddress,
      value: options.value || new BigNumber(0)
    }
    const ethFees = rawTx.gasLimit.multipliedBy(rawTx.gasPrice)
    return {
      ethFees: this.utils.formatToAmountInternal(ethFees, ETH_DECIMALS),
      rawTx
    }
  }

  /**
   * Returns transaction fees and raw transaction object for transferring ETH.
   * @param senderAddress address of user sending the transfer
   * @param receiverAddress address of user receiving the transfer
   * @param rawValue transfer amount in wei
   * @param gasPrice (optional)
   * @param gasLimit (optional)
   * @returns A ethereum transaction object containing and the estimated transaction fees in ETH.
   */
  public async prepValueTx(
    senderAddress: string,
    receiverAddress: string,
    rawValue: BigNumber,
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    const txInfos = await this.signer.getTxInfos(senderAddress)
    const rawTx = {
      from: senderAddress,
      gasLimit: options.gasLimit || new BigNumber(21000),
      gasPrice: options.gasPrice || txInfos.gasPrice,
      nonce: txInfos.nonce,
      to: receiverAddress,
      value: rawValue
    }
    const ethFees = rawTx.gasLimit.multipliedBy(rawTx.gasPrice)
    return {
      ethFees: this.utils.formatToAmountInternal(ethFees, ETH_DECIMALS),
      rawTx
    }
  }

  /**
   * Signs and sends the given transaction object.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<any> {
    return this.signer.confirm(rawTx)
  }

  /**
   * Sets a new signer strategy for signing and sending transactions.
   * @param signer New transaction signer.
   */
  public setSigner(signer: TxSigner) {
    this.signer = signer
  }

  /**
   * Returns the latest block number of the underlying blockchain.
   */
  public getBlockNumber(): Promise<number> {
    return this.utils.fetchUrl<number>('blocknumber')
  }
}
