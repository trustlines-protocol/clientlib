import BigNumber from 'bignumber.js'

import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import {
  EventFilterOptions,
  TxOptions,
  Amount,
  TxObject,
  AnyTokenEventRaw,
  AnyTokenEvent
} from './typings'

const ETH_DECIMALS = 18

/**
 * The class EthWrapper contains all methods for depositing, withdrawing and transferring wrapped ETH.
 */
export class EthWrapper {
  private _user: User
  private _utils: Utils
  private _transaction: Transaction

  constructor (
    user: User,
    utils: Utils,
    transaction: Transaction
  ) {
    this._user = user
    this._utils = utils
    this._transaction = transaction
  }

  public getAddresses (): Promise<any> {
    return this._utils.fetchUrl<string[]>('exchange/eth')
  }

  public async getBalance (ethWrapperAddress: string): Promise<Amount> {
    const { _user, _utils } = this
    const endpoint = `tokens/${ethWrapperAddress}/users/${_user.address}/balance`
    const balance = await _utils.fetchUrl<string>(endpoint)
    return _utils.formatToAmount(balance, ETH_DECIMALS)
  }

  public async prepTransfer (
    ethWrapperAddress: string,
    receiverAddress: string,
    value: number | string,
    options: TxOptions = {}
  ): Promise<TxObject> {
    const { _transaction, _user, _utils } = this
    const { gasPrice, gasLimit } = options
    const { rawTx, ethFees } = await _transaction.prepFuncTx(
      _user.address,
      ethWrapperAddress,
      'UnwEth',
      'transfer',
      [
        receiverAddress,
        _utils.convertToHexString(_utils.calcRaw(value, ETH_DECIMALS))
      ],
      {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasPrice ? new BigNumber(gasLimit) : undefined
      }
    )
    return {
      rawTx,
      ethFees: _utils.convertToAmount(ethFees)
    }
  }

  public prepDeposit (
    ethWrapperAddress: string,
    value: number | string,
    options: TxOptions = {}
  ): Promise<any> {
    const { _transaction, _user, _utils } = this
    const { gasPrice, gasLimit } = options
    return _transaction.prepFuncTx(
      _user.address,
      ethWrapperAddress,
      'UnwEth',
      'deposit',
      [],
      {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasPrice ? new BigNumber(gasLimit) : undefined,
        value: new BigNumber(_utils.calcRaw(value, ETH_DECIMALS))
      }
    )
  }

  public async prepWithdraw (
    ethWrapperAddress: string,
    value: number | string,
    options: TxOptions = {}
  ): Promise<TxObject> {
    const { _transaction, _user, _utils } = this
    const { gasPrice, gasLimit } = options
    const { rawTx, ethFees } = await _transaction.prepFuncTx(
      _user.address,
      ethWrapperAddress,
      'UnwEth',
      'withdraw',
      [ _utils.convertToHexString(_utils.calcRaw(value, ETH_DECIMALS)) ],
      {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasPrice ? new BigNumber(gasLimit) : undefined
      }
    )
    return {
      rawTx,
      ethFees: _utils.convertToAmount(ethFees)
    }
  }

  public async confirm (rawTx): Promise<string> {
    const signedTx = await this._user.signTx(rawTx)
    return this._transaction.relayTx(signedTx)
  }

  public async getLogs (
    ethWrapperAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<AnyTokenEvent[]> {
    const { _user, _utils } = this
    const { type, fromBlock } = filter
    const baseUrl = `tokens/${ethWrapperAddress}/users/${_user.address}/events`
    const events = await _utils.fetchUrl<AnyTokenEventRaw[]>(
      _utils.buildUrl(baseUrl, { type, fromBlock })
    )
    return events.map(event => _utils.formatEvent(event, ETH_DECIMALS))
  }
}
