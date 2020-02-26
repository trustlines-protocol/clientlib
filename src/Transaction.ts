import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import * as TrustlinesContractsAbi from 'trustlines-contracts-abi'

import { TLProvider } from './providers/TLProvider'
import { TLSigner } from './signers/TLSigner'

import utils, { convertToDelegationFees } from './utils'

import {
  Amount,
  DelegationFeesInternal,
  MetaTransactionFees,
  RawTxObject,
  TxFeesAmounts,
  TxObjectInternal,
  TxOptionsInternal
} from './typings'

import { CurrencyNetwork } from './CurrencyNetwork'

const ETH_DECIMALS = 18
export const GAS_LIMIT_MULTIPLIER = 1.2

/**
 * The Transaction class contains functions that are needed for Ethereum transactions.
 */
export class Transaction {
  private signer: TLSigner
  private provider: TLProvider
  private currencyNetwork: CurrencyNetwork

  constructor(params: {
    signer: TLSigner
    provider: TLProvider
    currencyNetwork: CurrencyNetwork
  }) {
    this.signer = params.signer
    this.provider = params.provider
    this.currencyNetwork = params.currencyNetwork
  }

  /**
   * Returns transaction fees and the raw transaction object for calling a contract function.
   * @param userAddress address of user that calls the contract function
   * @param contractAddress address of deployed contract
   * @param contractName name of deployed contract
   * @param functionName name of contract function
   * @param args arguments of function in same order as in contract
   * @param options.gasPrice (optional)
   * @param options.gasLimit (optional)
   * @param options.value (optional)
   * @param options.delegationFees (optional) delegation fees for a meta transaction.
   * @param options.currencyNetworkOfFees (optional) currency network of fees for a meta transaction.
   * @returns An ethereum transaction object and the estimated transaction fees in ETH.
   */
  // TODO: change docs
  public async prepareContractTransaction(
    userAddress: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    args: any[],
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    // TODO: get the gas limit in

    const abi = new ethers.utils.Interface(
      TrustlinesContractsAbi[contractName].abi
    )
    let rawTx: RawTxObject = {
      data: abi.functions[functionName].encode(args),
      from: userAddress,
      to: contractAddress,
      gasLimit: options.gasLimit || new BigNumber(600_000),
      gasPrice: options.gasPrice || undefined,
      baseFee: options.baseFee || undefined,
      currencyNetworkOfFees: options.currencyNetworkOfFees || undefined,
      value: options.value || new BigNumber(0)
    }

    rawTx = await this.signer.fillFeesAndNonce(rawTx)

    return {
      txFees: await this.formatTxFeesToAmount(rawTx),
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
   * @returns An ethereum transaction object containing and the estimated transaction fees in ETH.
   */
  public async prepareValueTransaction(
    senderAddress: string,
    receiverAddress: string,
    rawValue: BigNumber,
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    // The gas limit for the value transaction has to be higher than 21_000 because of identity contract overhead
    let rawTx: RawTxObject = {
      from: senderAddress,
      to: receiverAddress,
      gasLimit: options.gasLimit || new BigNumber(50_000),
      gasPrice: options.gasPrice || undefined,
      baseFee: options.baseFee || undefined,
      currencyNetworkOfFees: options.currencyNetworkOfFees || undefined,
      value: rawValue
    }

    rawTx = await this.signer.fillFeesAndNonce(rawTx)

    return {
      txFees: await this.formatTxFeesToAmount(rawTx),
      rawTx
    }
  }

  /**
   * Signs and sends the given transaction object.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    return this.signer.confirm(rawTx)
  }

  /**
   * Formats the tx fees in raw tx and finds the currency network decimals to use in case of meta-tx fees
   * @param rawTx
   */
  private async formatTxFeesToAmount(
    rawTx: RawTxObject
  ): Promise<TxFeesAmounts> {
    // 18 decimals for regular tx fees in ether
    let feeDecimals = 18
    if (rawTx.currencyNetworkOfFees) {
      feeDecimals = (await this.currencyNetwork.getDecimals(
        rawTx.currencyNetworkOfFees
      )).networkDecimals
    }

    return {
      gasPrice: utils.formatToAmount(rawTx.gasPrice, feeDecimals),
      gasLimit: utils.formatToAmount(rawTx.gasLimit, 0),
      baseFee: utils.formatToAmount(rawTx.baseFee, feeDecimals),
      totalFee: utils.formatToAmount(rawTx.totalFee, feeDecimals),
      currencyNetworkOfFees: rawTx.currencyNetworkOfFees || undefined
    }
  }
}
