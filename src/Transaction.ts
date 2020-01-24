import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import * as TrustlinesContractsAbi from 'trustlines-contracts-abi'

import { TLProvider } from './providers/TLProvider'
import { TLSigner } from './signers/TLSigner'

import utils, { convertToDelegationFees } from './utils'

import {
  DelegationFeesInternal,
  MetaTransactionFees,
  RawTxObject,
  TxObjectInternal,
  TxOptionsInternal
} from './typings'

import { CurrencyNetwork } from './CurrencyNetwork'

const ETH_DECIMALS = 18

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
  public async prepareContractTransaction(
    userAddress: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    args: any[],
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    const txInfos = await this.signer.getTxInfos(userAddress)

    const abi = new ethers.utils.Interface(
      TrustlinesContractsAbi[contractName].abi
    )
    const rawTx: RawTxObject = {
      data: abi.functions[functionName].encode(args),
      from: userAddress,
      gasLimit: options.gasLimit || new BigNumber(600000),
      gasPrice: options.gasPrice || txInfos.gasPrice,
      nonce: txInfos.nonce,
      to: contractAddress,
      value: options.value || new BigNumber(0)
    }
    const delegationFeesInternal = options.delegationFees
      ? utils.formatToDelegationFeesInternal(
          options.delegationFees.baseFee,
          (await this.currencyNetwork.getDecimals(
            options.delegationFees.currencyNetworkOfFees
          )).networkDecimals,
          options.delegationFees.gasPrice,
          options.delegationFees.currencyNetworkOfFees
        )
      : await this.getDelegationFees(rawTx)

    rawTx.delegationFees = {
      baseFee: delegationFeesInternal.baseFee.raw,
      gasPrice: delegationFeesInternal.gasPrice.raw,
      currencyNetworkOfFees: delegationFeesInternal.currencyNetworkOfFees
    }

    const ethFees = new BigNumber(rawTx.gasLimit).multipliedBy(rawTx.gasPrice)

    return {
      ethFees: utils.formatToAmountInternal(ethFees, ETH_DECIMALS),
      delegationFees: delegationFeesInternal,
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
    const txInfos = await this.signer.getTxInfos(senderAddress)

    const rawTx: RawTxObject = {
      from: senderAddress,
      gasLimit: options.gasLimit || new BigNumber(21000),
      gasPrice: options.gasPrice || txInfos.gasPrice,
      nonce: txInfos.nonce,
      to: receiverAddress,
      value: rawValue
    }
    const delegationFeesInternal = options.delegationFees
      ? utils.formatToDelegationFeesInternal(
          options.delegationFees.baseFee,
          (await this.currencyNetwork.getDecimals(
            options.delegationFees.currencyNetworkOfFees
          )).networkDecimals,
          options.delegationFees.gasPrice,
          options.delegationFees.currencyNetworkOfFees
        )
      : await this.getDelegationFees(rawTx)

    rawTx.delegationFees = {
      baseFee: delegationFeesInternal.baseFee.raw,
      gasPrice: delegationFeesInternal.gasPrice.raw,
      currencyNetworkOfFees: delegationFeesInternal.currencyNetworkOfFees
    }

    const ethFees = new BigNumber(rawTx.gasLimit).multipliedBy(rawTx.gasPrice)

    return {
      ethFees: utils.formatToAmountInternal(ethFees, ETH_DECIMALS),
      delegationFees: delegationFeesInternal,
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
   * Returns delegation fees for given rawTx
   * @param rawTx the rawTx to get the delegation fees for
   * @returns the delegation fees to be paid for given rawTx
   */
  private async getDelegationFees(
    rawTx: RawTxObject
  ): Promise<DelegationFeesInternal> {
    const metaTransactionFees: MetaTransactionFees = await this.signer.getMetaTxFees(
      rawTx
    )

    let currencyDecimals = 0
    if (
      metaTransactionFees.baseFee !== '0' &&
      metaTransactionFees.currencyNetworkOfFees !== ''
    ) {
      currencyDecimals = (await this.currencyNetwork.getDecimals(
        metaTransactionFees.currencyNetworkOfFees
      )).networkDecimals
    }

    return utils.formatToDelegationFeesInternal(
      metaTransactionFees.baseFee,
      currencyDecimals,
      metaTransactionFees.gasPrice,
      metaTransactionFees.currencyNetworkOfFees
    )
  }
}
