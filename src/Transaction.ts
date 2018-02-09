import { Utils } from './Utils'
import * as lightwallet from 'eth-lightwallet'
// declare let lightwallet
import * as ethUtils from 'ethereumjs-util'

const CONTRACTS = require('../contracts.json')

export class Transaction {

  constructor (private utils: Utils) {
  }

  public prepFuncTx (userAddress: string,
                     contractAddress: string,
                     contractName: string,
                     functionName: string,
                     parameters: any[],
                     estimatedGas?: number): Promise<any> {
    return this.getTxInfos(userAddress)
      .then(txinfos => {
        const gasLimit = estimatedGas ? estimatedGas * 1.5 : 2000000
        const txOptions = {
          gasPrice: txinfos.gasPrice, // TODO let user set gas price
          gasLimit, // TODO let user set gas limit
          value: 0,
          nonce: txinfos.nonce,
          to: contractAddress.toLowerCase()
        }
        const txObj = {
          rawTx: lightwallet.txutils.functionTx(
            CONTRACTS[ contractName ].abi, functionName, parameters, txOptions
          ),
          ethFees: this.utils.formatAmount(gasLimit * txOptions.gasPrice, 18),
          gasPrice: txinfos.gasPrice
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
    value: number,
    options: any = {}
  ): Promise<any> {
    const { gasPrice, gasLimit } = options
    return this.getTxInfos(from)
      .then(txinfos => {
        const txOptions = {
          gasPrice: gasPrice || txinfos.gasPrice,
          gasLimit: gasLimit || 1000000,
          value: this.utils.convertEthToWei(value),
          nonce: txinfos.nonce,
          to: to.toLowerCase()
        }
        return {
          rawTx: lightwallet.txutils.valueTx(txOptions),
          ethFees: this.utils.formatAmount(21000 * txOptions.gasPrice, 18)
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
