import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import * as TrustlinesContractsAbi from 'trustlines-contracts-abi'

import { TLProvider } from './providers/TLProvider'
import { TLSigner } from './signers/TLSigner'

import utils from './utils'

import {
  RawTxObject,
  TxInfos,
  TxObjectInternal,
  TxOptionsInternal
} from './typings'

const ETH_DECIMALS = 18

export const prepFuncTx = async (
  userAddress: string,
  contractAddress: string,
  contractName: string,
  functionName: string,
  args: any[],
  txInfos: TxInfos,
  options: TxOptionsInternal = {}
): Promise<TxObjectInternal> => {
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
