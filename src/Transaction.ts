import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import * as TrustlinesContractsAbi from 'trustlines-contracts-abi'

import { TLProvider } from './providers/TLProvider'
import { TLSigner } from './signers/TLSigner'

import utils from './utils'

import { RawTxObject, TxObjectInternal, TxOptionsInternal } from './typings'

const ETH_DECIMALS = 18

/**
 * The Transaction class contains functions that are needed for Ethereum transactions.
 */
export class Transaction {
  private signer: TLSigner
  private provider: TLProvider

  constructor(params: { signer: TLSigner; provider: TLProvider }) {
    this.signer = params.signer
    this.provider = params.provider
  }

  /**
   * Returns transaction fees and the raw transaction object for calling a contract function.
   * @param userAddress address of user that calls the contract function
   * @param contractAddress address of deployed contract
   * @param contractName name of deployed contract
   * @param functionName name of contract function
   * @param args arguments of function in same order as in contract
   * @param gasPrice (optional)
   * @param gasLimit (optional)
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
    const rawTx = {
      data: abi.functions[functionName].encode(args),
      from: userAddress,
      gasLimit: options.gasLimit || new BigNumber(600000),
      gasPrice: options.gasPrice || txInfos.gasPrice,
      nonce: txInfos.nonce,
      to: contractAddress,
      value: options.value || new BigNumber(0)
    }
    const ethFees = rawTx.gasLimit.multipliedBy(rawTx.gasPrice)
    return {
      ethFees: utils.formatToAmountInternal(ethFees, ETH_DECIMALS),
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
      ethFees: utils.formatToAmountInternal(ethFees, ETH_DECIMALS),
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
}
