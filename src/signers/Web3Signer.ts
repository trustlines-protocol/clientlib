import { BigNumber } from 'bignumber.js'

import { TLSigner } from './TLSigner'

import { Amount, RawTxObject, Signature } from '../typings'

/**
 * The Web3Signer class contains functions for signing transactions with a web3 provider.
 */
export class Web3Signer implements TLSigner {
  public address: string
  public pubKey: string

  private web3: any

  constructor(web3: any) {
    this.web3 = web3
  }

  /**
   * Signs a transaction using the web3 provider.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    const { transactionHash } = await this.web3.eth.sendTransaction({
      ...rawTx,
      gas: new BigNumber(rawTx.gasLimit).toNumber()
    })
    return transactionHash
  }

  public async getAddress(): Promise<string> {
    throw new Error('Method not implemented.')
  }

  public async signMessage(
    message: string | ArrayLike<number>
  ): Promise<Signature> {
    throw new Error('Method not implemented.')
  }

  public async signMsgHash(): Promise<Signature> {
    throw new Error('Method for web3 signer not implemented yet.')
  }

  public async getBalance(): Promise<Amount> {
    throw new Error('Method for web3 signer not implemented yet.')
  }
}
