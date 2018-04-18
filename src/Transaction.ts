import { Utils } from './Utils'
import { TxOptions } from './typings'

import * as lightwallet from 'eth-lightwallet'
// declare let lightwallet
import * as ethUtils from 'ethereumjs-util'

const CONTRACTS = require('../contracts.json')

export class Transaction {

  constructor (private utils: Utils) {
  }

  public prepFuncTx (
    userAddress: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    parameters: any[],
    { gasPrice, gasLimit }: TxOptions = {}
  ): Promise<any> {
    return this.getTxInfos(userAddress)
      .then(txinfos => {
        const txOptions = {
          gasPrice: gasPrice || txinfos.gasPrice,
          gasLimit: gasLimit || 600000,
          value: 0,
          nonce: txinfos.nonce,
          to: contractAddress.toLowerCase()
        }
        const txObj = {
          rawTx: lightwallet.txutils.functionTx(
            CONTRACTS[ contractName ].abi, functionName, parameters, txOptions
          ),
          ethFees: this.utils.formatAmount(
            txOptions.gasLimit * txOptions.gasPrice, 18
          )
        }
        return txObj
      })
      .catch(error => {
        return Promise.reject(error)
      })
  }

  public prepValueTx (
    from: string,
    to: string,
    rawValue: number,
    { gasPrice, gasLimit }: TxOptions = {}
  ): Promise<any> {
    return this.getTxInfos(from)
      .then(txinfos => {
        const txOptions = {
          gasPrice: gasPrice || txinfos.gasPrice,
          gasLimit: gasLimit || 21000,
          value: rawValue,
          nonce: txinfos.nonce,
          to: to.toLowerCase()
        }
        return {
          rawTx: lightwallet.txutils.valueTx(txOptions),
          ethFees: this.utils.formatAmount(txOptions.gasLimit * txOptions.gasPrice, 18)
        }
      })
      .catch(error => Promise.reject(error))
  }

  public relayTx (rawTx: string): Promise<any> {
    const headers = new Headers({
      'Content-Type': 'application/json'
    })
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify({ rawTransaction: `0x${rawTx}` })
    }
    return this.utils.fetchUrl('relay', options)
  }

  public getBlockNumber (): Promise<any> {
    return this.utils.fetchUrl('blocknumber')
  }

  private getTxInfos (userAddress: string): Promise<any> {
    return this.utils.fetchUrl(`users/${userAddress}/txinfos`)
  }

  private handleError (error: any) {
    return Promise.reject(error.json().message || error)
  }
}
