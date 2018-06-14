import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import {
  TLOptions,
  EventFilterOptions,
  TLEvent,
  TxObject,
  TrustlineObject,
  TrustlineRaw
} from './typings'

/**
 * The Trustline class contains all relevant methods for retrieving, creating and
 * editing trustlines.
 */
export class Trustline {
  private _event: Event
  private _user: User
  private _utils: Utils
  private _transaction: Transaction
  private _currencyNetwork: CurrencyNetwork

  constructor (
    event: Event,
    user: User,
    utils: Utils,
    transaction: Transaction,
    currencyNetwork: CurrencyNetwork
  ) {
    this._event = event
    this._user = user
    this._utils = utils
    this._transaction = transaction
    this._currencyNetwork = currencyNetwork
  }

  /**
   * Prepares an ethereum transaction object for creating a trustline update request. Called by initiator
   * of update request.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty who receives trustline update request.
   * @param creditlineGiven Proposed creditline limit given by iniator to counterparty,
   *              i.e. 1.23 if network has to 2 decimals.
   * @param creditlineReceived Proposed creditline limit received by iniator from counterparty,
   *                 i.e. 1.23 if network has to 2 decimals.
   * @param options Options for creating an ethereum transaction. See type `TLOptions` for more information.
   * @param options.decimals Decimals of currency network can be provided manually if known.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   */
  public async prepareUpdate (
    networkAddress: string,
    counterpartyAddress: string,
    creditlineGiven: number | string,
    creditlineReceived: number | string,
    options: TLOptions = {}
  ): Promise<TxObject> {
    const { _currencyNetwork, _transaction, _user, _utils } = this
    let { decimals, gasLimit, gasPrice } = options
    decimals = await _currencyNetwork.getDecimals(networkAddress, decimals)
    return _transaction.prepFuncTx(
      _user.address,
      networkAddress,
      'CurrencyNetwork',
      'updateTrustline',
      [
        counterpartyAddress,
        _utils.calcRaw(creditlineGiven, decimals),
        _utils.calcRaw(creditlineReceived, decimals)
      ],
      { gasPrice, gasLimit }
    )
  }

  /**
   * Prepares an ethereum transaction object for accepting a trustline update request. Called
   * by receiver of initial update request.
   * @param networkAddress Address of a currency network.
   * @param initiator Address of user who initiated the trustline udpate request.
   * @param creditlineGiven Proposed creditline limit given by receiver to initiator,
   *              i.e. 1.23 if network has to 2 decimals.
   * @param creditlineReceived Proposed creditline limit received by iniator from receiver,
   *                 i.e. 1.23 if network has to 2 decimals.
   * @param options Options for creating a ethereum transaction. See type `TLOptions` for more information.
   * @param options.decimals Decimals of currency network can be provided manually if known.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   */
  public prepareAccept (
    networkAddress: string,
    initiator: string,
    creditlineGiven: number | string,
    creditlineReceived: number | string,
    options: TLOptions = {}
  ): Promise<TxObject> {
    return this.prepareUpdate(
      networkAddress,
      initiator,
      creditlineGiven,
      creditlineReceived,
      options
    )
  }

  /**
   * Signs a raw transaction as returned by `prepareUpdate` or `prepareAccept` and relays
   * the signed transaction.
   * @param rawTx RLP encoded hex string defining the transaction.
   */
  public async confirm (rawTx: string): Promise<string> {
    const signedTx = await this._user.signTx(rawTx)
    return this._transaction.relayTx(signedTx)
  }

  /**
   * Returns all trustlines of a loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   */
  public async getAll (networkAddress: string): Promise<TrustlineObject[]> {
    const { _user, _utils, _currencyNetwork } = this
    const endpoint = `networks/${networkAddress}/users/${_user.address}/trustlines`
    const [ trustlines, decimals ] = await Promise.all([
      _utils.fetchUrl<TrustlineRaw[]>(endpoint),
      _currencyNetwork.getDecimals(networkAddress)
    ])
    return trustlines.map(trustline => this._formatTrustline(trustline, decimals))
  }

  /**
   * Returns a trustline to a counterparty address in a specified currency network.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty of trustline.
   */
  public async get (
    networkAddress: string,
    counterpartyAddress: string
  ): Promise<TrustlineObject> {
    const { _user, _utils, _currencyNetwork } = this
    const endpoint = `networks/${networkAddress}/users/${_user.address}/trustlines/${counterpartyAddress}`
    const [ trustline, decimals ] = await Promise.all([
      _utils.fetchUrl<TrustlineRaw>(endpoint),
      _currencyNetwork.getDecimals(networkAddress)
    ])
    return this._formatTrustline(trustline, decimals)
  }

  /**
   * Returns trustline update requests of loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public getRequests (
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<TLEvent[]> {
    return this._event.get(networkAddress, {
      ...filter,
      type: 'TrustlineUpdateRequest'
    })
  }

  /**
   * Returns trustline updates of loaded user in a currency network. A update
   * happens when a user accepts a trustline update request.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public getUpdates (
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<TLEvent[]> {
    return this._event.get(networkAddress, {
      ...filter,
      type: 'TrustlineUpdate'
    })
  }

  /**
   * Formats number values of trustline retrieved from the relay server.
   * @param trustline unformatted trustline
   * @param decimals decimals of currency network
   */
  private _formatTrustline (
    trustline: TrustlineRaw,
    decimals: number
  ): TrustlineObject {
    return {
      ...trustline,
      balance: this._utils.formatAmount(trustline.balance, decimals),
      given: this._utils.formatAmount(trustline.given, decimals),
      leftGiven: this._utils.formatAmount(trustline.leftGiven, decimals),
      leftReceived: this._utils.formatAmount(trustline.leftReceived, decimals),
      received: this._utils.formatAmount(trustline.received, decimals)
    }
  }
}
