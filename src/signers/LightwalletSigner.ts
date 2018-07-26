
import { TxSigner } from './TxSigner'
import { User } from '../User'
import { Utils } from '../Utils'
import {
  TxInfos,
  TxInfosRaw,
  RawTxObject
} from '../typings'

import { BigNumber } from 'bignumber.js'
import * as lightwallet from 'eth-lightwallet'
// declare let lightwallet

/**
 * The LightwalletSigner class contains functions for signing transactions with eth-lightwallet.
 */
export class LightwalletSigner implements TxSigner {
  private _user: User
  private _utils: Utils

  constructor (user: User, utils: Utils) {
    this._user = user
    this._utils = utils
  }

  /**
   * Takes a raw transaction object, turns it into a RLP encoded hex string, signs it with
   * the loaded user and relays the transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm (rawTx: RawTxObject): Promise<string> {
    let rlpTx
    const txOptions = {
      ...rawTx,
      from: rawTx.from.toLowerCase(),
      gasPrice: this._utils.convertToHexString(rawTx.gasPrice),
      gasLimit: this._utils.convertToHexString(rawTx.gasLimit),
      value: this._utils.convertToHexString(rawTx.value)
    }
    if (txOptions.to) {
      txOptions.to = txOptions.to.toLowerCase()
    }
    if (rawTx.functionCallData) {
      rlpTx = lightwallet.txutils.functionTx(
        rawTx.functionCallData.abi,
        rawTx.functionCallData.functionName,
        rawTx.functionCallData.args,
        txOptions
      )
    } else {
      rlpTx = lightwallet.txutils.valueTx(txOptions)
    }
    const signedTx = await this._user.signTx(rlpTx)
    return this._relayTx(signedTx)
  }

  /**
   * Returns needed information for creating an ethereum transaction.
   * @param userAddress address of user creating the transaction
   * @returns Information for creating an ethereum transaction for the given user address.
   *          See type `TxInfos` for more details.
   */
  public async getTxInfos (userAddress: string): Promise<TxInfos> {
    const endpoint = `users/${userAddress}/txinfos`
    const { nonce, gasPrice, balance } = await this._utils.fetchUrl<TxInfosRaw>(endpoint)
    return {
      nonce,
      gasPrice: new BigNumber(gasPrice),
      balance: new BigNumber(balance)
    }
  }

  /**
   * Relays signed rlp encoded transactions.
   * @param signedTx signed RLP encoded ethereum transaction
   */
  private _relayTx (signedTx: string): Promise<string> {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const options = {
      method: 'POST',
      headers,
      body: JSON.stringify({ rawTransaction: `0x${signedTx}` })
    }
    return this._utils.fetchUrl<string>('relay', options)
  }
}
