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

  /**
   * Returns all known ETH wrapper contract addresses from the relay server.
   */
  public getAddresses (): Promise<string[]> {
    return this._utils.fetchUrl<string[]>('exchange/eth')
  }

  /**
   * Returns the amount of already wrapped ETH on the given ETH wrapper contract.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   */
  public async getBalance (ethWrapperAddress: string): Promise<Amount> {
    const { _user, _utils } = this
    const endpoint = `tokens/${ethWrapperAddress}/users/${_user.address}/balance`
    const balance = await _utils.fetchUrl<string>(endpoint)
    return _utils.formatToAmount(balance, ETH_DECIMALS)
  }

  /**
   * Prepares an ethereum transaction object for transffering wrapped ETH where the
   * loaded user is the sender.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   * @param receiverAddress Address of receiver of transfer.
   * @param value Amount of wrapped ETH to transfer.
   * @param options Transaction options. See `TxOptions` for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
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

  /**
   * Prepares an ethereum transaction object for depositing/wrapping ETH.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   * @param value Amount of ETH to deposit/wrap.
   * @param options Tansaction options. See `TxOptions` for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public async prepDeposit (
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
      'deposit',
      [],
      {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasPrice ? new BigNumber(gasLimit) : undefined,
        value: new BigNumber(_utils.calcRaw(value, ETH_DECIMALS))
      }
    )
    return {
      rawTx,
      ethFees: _utils.convertToAmount(ethFees)
    }
  }

  /**
   * Prepares an ethereum transaction object for withdrawing/unwrapping ETH.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   * @param value Amount of ETH to withdraw/unwrap.
   * @param options Transaction options. See `TxOptions` for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
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

  /**
   * Signs a raw transaction as returned by `prepTransfer`, `prepDeposit` or `prepWithdraw`
   * and relays the signed transaction.
   * @param rawTx RLP encoded hex string defining the transaction.
   */
  public async confirm (rawTx): Promise<string> {
    const signedTx = await this._user.signTx(rawTx)
    return this._transaction.relayTx(signedTx)
  }

  /**
   * Returns event logs of the ETH wrapper contract for the loaded user.
   * @param ethWrapperAddress Address of the ETH wrapper contract.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   * @param filter.type Available event types are `Transfer`, `Deposit` and `Withdrawal`.
   * @param filter.fromBlock Start of block range for event logs.
   */
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
