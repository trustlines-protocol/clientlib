import * as TrustlinesContractsAbi from '@trustlines/trustlines-contracts-abi'
import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { AddressZero } from 'ethers/constants'

import { TLProvider } from './providers/TLProvider'
import { TLSigner } from './signers/TLSigner'

import utils from './utils'

import {
  PaidDelegationFeesRaw,
  RawTxObject,
  TransactionStatusObject,
  TxFeesAmounts,
  TxFeesRaw,
  TxObjectInternal,
  TxOptionsInternal
} from './typings'

import { CurrencyNetwork } from './CurrencyNetwork'

// Ethers will otherwise warn for every call on `updateTrustline` due to function overloading
// see https://github.com/ethers-io/ethers.js/issues/407
ethers.errors.setLogLevel('error')

const ETH_DECIMALS = 18
export const GAS_LIMIT_MULTIPLIER = 1.2
// Value taken from the contracts gas tests
export const GAS_LIMIT_IDENTITY_OVERHEAD = new BigNumber(27_000)
export const GAS_LIMIT_VALUE_TRANSACTION = new BigNumber(21_000)
  .plus(GAS_LIMIT_IDENTITY_OVERHEAD.multipliedBy(GAS_LIMIT_MULTIPLIER))
  .integerValue(BigNumber.ROUND_DOWN)
export const GAS_LIMIT_DEFAULT_CONTRACT_TRANSACTION = new BigNumber(600_000)

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
   * @param options.baseFee (optional) base fees to be used notably for meta-transactions.
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
    const abi = new ethers.utils.Interface(
      TrustlinesContractsAbi[contractName].abi
    )
    const rawTx: RawTxObject = {
      data: abi.functions[functionName].encode(args),
      from: userAddress,
      to: contractAddress,
      gasLimit: options.gasLimit || GAS_LIMIT_DEFAULT_CONTRACT_TRANSACTION,
      gasPrice: options.gasPrice || undefined,
      baseFee: options.baseFee || undefined,
      currencyNetworkOfFees: options.currencyNetworkOfFees || undefined,
      value: options.value || new BigNumber(0)
    }

    const preparedTx = await this.signer.prepareTransaction(rawTx)

    return {
      txFees: await this.formatTxFeesToAmount(preparedTx.txFees),
      rawTx: preparedTx.rawTx
    }
  }

  /**
   * Returns transaction fees and raw transaction object for transferring ETH.
   * @param senderAddress address of user sending the transfer
   * @param receiverAddress address of user receiving the transfer
   * @param rawValue transfer amount in wei
   * @param options.gasPrice (optional)
   * @param options.gasLimit (optional)
   * @param options.baseFee (optional) base fees to be used notably for meta-transactions.
   * @param options.currencyNetworkOfFees (optional) currency network of fees for a meta transaction.
   * @returns An ethereum transaction object containing and the estimated transaction fees in ETH.
   */
  public async prepareValueTransaction(
    senderAddress: string,
    receiverAddress: string,
    rawValue: BigNumber,
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    const rawTx: RawTxObject = {
      from: senderAddress,
      to: receiverAddress,
      gasLimit: options.gasLimit || GAS_LIMIT_VALUE_TRANSACTION,
      gasPrice: options.gasPrice || undefined,
      baseFee: options.baseFee || undefined,
      currencyNetworkOfFees: options.currencyNetworkOfFees || undefined,
      value: rawValue
    }

    const preparedTx = await this.signer.prepareTransaction(rawTx)

    return {
      txFees: await this.formatTxFeesToAmount(preparedTx.txFees),
      rawTx: preparedTx.rawTx
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
   * Get the status of a sent tx either via txHash or via rawTx for a meta-tx
   * @param tx the hash of the transaction / meta-tx or raw transaction object from which a meta-tx was built.
   */
  public async getTxStatus(
    tx: string | RawTxObject
  ): Promise<TransactionStatusObject> {
    return this.signer.getTxStatus(tx)
  }

  /**
   * Get the effective delegation fees via enveloping transaction hash
   * @param txHash the hash of the transaction in which fees were paid
   * @returns a list of the delegation fees applied within the transaction paid by loaded user
   */
  public async getAppliedDelegationFees(
    txHash: string
  ): Promise<TxFeesAmounts[]> {
    const Url = utils.buildUrl(`/delegation-fees/`, {
      query: {
        transactionHash: txHash
      }
    })

    let paidFeesList = await this.provider.fetchEndpoint<
      PaidDelegationFeesRaw[]
    >(Url)
    // We might receive fees not paid by the loaded user so we filter them out
    paidFeesList = paidFeesList.filter(
      async paidFee => paidFee.feeSender === (await this.signer.getAddress())
    )

    return Promise.all(
      paidFeesList.map(async paidFees =>
        this.formatTxFeesToAmount({
          totalFee: paidFees.totalFee,
          feeRecipient: paidFees.feeRecipient,
          currencyNetworkOfFees: paidFees.currencyNetworkOfFees
        })
      )
    )
  }

  /**
   * Formats the tx fees and finds the currency network decimals to use in case of meta-tx fees
   * @param txFees
   */
  private async formatTxFeesToAmount(
    txFees: TxFeesRaw
  ): Promise<TxFeesAmounts> {
    // 18 decimals for regular tx fees in ether
    let feeDecimals = ETH_DECIMALS
    // Only possible if the currencyNetwork is set and is not the zero address.
    if (
      txFees.currencyNetworkOfFees &&
      txFees.currencyNetworkOfFees !== AddressZero
    ) {
      feeDecimals = (
        await this.currencyNetwork.getDecimals(txFees.currencyNetworkOfFees)
      ).networkDecimals
    }

    return {
      gasPrice:
        txFees.gasPrice !== undefined
          ? utils.formatToAmount(txFees.gasPrice, feeDecimals)
          : null,
      gasLimit:
        txFees.gasLimit !== undefined
          ? utils.formatToAmount(txFees.gasLimit, 0)
          : null,
      baseFee:
        txFees.baseFee !== undefined
          ? utils.formatToAmount(txFees.baseFee, feeDecimals)
          : null,
      totalFee: utils.formatToAmount(txFees.totalFee, feeDecimals),
      feeRecipient: txFees.feeRecipient || null,
      // TODO remove handling of AddressZero. Only there for backwards compatibility.
      currencyNetworkOfFees:
        (txFees.currencyNetworkOfFees !== AddressZero
          ? txFees.currencyNetworkOfFees
          : null) || null
    }
  }
}
