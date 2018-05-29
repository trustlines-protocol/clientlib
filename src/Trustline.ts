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
  TrustlineUnformatted
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
   * Prepares a tx object for creating a trustline update request. Called by initiator
   * of update request.
   * @param network address of currency network
   * @param counterparty address of counterparty who receives trustline update request
   * @param given proposed creditline limit given by iniator to counterparty,
   *              i.e. 1.23 if network has to 2 decimals
   * @param received proposed creditline limit received from counterparty to initiator,
   *                 i.e. 1.23 if network has to 2 decimals
   * @param decimals (optional) decimals of currency network can be provided manually if known
   * @param gasLimit (optional)
   * @param gasPrice (optional)
   */
  public async prepareUpdate (
    network: string,
    counterparty: string,
    given: number | string,
    received: number | string,
    { decimals, gasLimit, gasPrice }: TLOptions = {}
  ): Promise<TxObject> {
    try {
      const { _currencyNetwork, _transaction, _user, _utils } = this
      decimals = await _currencyNetwork.getDecimals(network, decimals)
      return _transaction.prepFuncTx(
        _user.address,
        network,
        'CurrencyNetwork',
        'updateTrustline',
        [ counterparty, _utils.calcRaw(given, decimals), _utils.calcRaw(received, decimals) ],
        { gasPrice, gasLimit }
      )
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Prepares a tx object for accepting a trustline update request. Called
   * by receiver of initial update request.
   * @param network address of currency network
   * @param initiator address of user who initiated trustline udpate request
   * @param given received proposal of creditline limit given to initiator,
   *              i.e. 1.23 if network has to 2 decimals
   * @param received received proposal of creditline limit received by iniator,
   *                 i.e. 1.23 if network has to 2 decimals
   * @param decimals (optional) decimals of currency network can be provided manually if known
   * @param gasLimit (optional)
   * @param gasPrice (optional)
   */
  public prepareAccept (
    network: string,
    initiator: string,
    given: number | string,
    received: number | string,
    { decimals, gasLimit, gasPrice }: TLOptions = {}
  ): Promise<TxObject> {
    return this.prepareUpdate(
      network,
      initiator,
      given,
      received,
      { decimals, gasLimit, gasPrice }
    )
  }

  /**
   * Signs and relays raw transaction as returned in prepareUpdate or prepareAccept.
   * @param rawTx RLP-encoded hex string defining the transaction
   */
  public async confirm (rawTx: string): Promise<string> {
    try {
      const signedTx = await this._user.signTx(rawTx)
      return this._transaction.relayTx(signedTx)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Returns all trustlines of a loaded user in a currency network.
   * @param network address of currency network
   */
  public async getAll (network: string): Promise<TrustlineObject[]> {
    try {
      const { _user, _utils, _currencyNetwork } = this
      const endpoint = `networks/${network}/users/${_user.address}/trustlines`
      const [ trustlines, decimals ] = await Promise.all([
        _utils.fetchUrl<TrustlineUnformatted[]>(endpoint),
        _currencyNetwork.getDecimals(network)
      ])
      return trustlines.map(trustline => this._formatTrustline(trustline, decimals))
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Returns a trustline to a counterparty address in a specified currency network.
   * @param network address of currency network
   * @param counterparty address of counterparty of trustline
   */
  public async get (network: string, counterparty: string): Promise<TrustlineObject> {
    try {
      const { _user, _utils, _currencyNetwork } = this
      const endpoint = `networks/${network}/users/${_user.address}/trustlines/${counterparty}`
      const [ trustline, decimals ] = await Promise.all([
        _utils.fetchUrl<TrustlineUnformatted>(endpoint),
        _currencyNetwork.getDecimals(network)
      ])
      return this._formatTrustline(trustline, decimals)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Returns trustline update requests of loaded user in a currency network.
   * @param network address of currency network
   * @param fromBlock start of block range
   */
  public getRequests (
    network: string,
    { fromBlock }: EventFilterOptions = {}
  ): Promise<TLEvent[]> {
    const filter = { type: 'TrustlineUpdateRequest' }
    if (fromBlock) {
      filter['fromBlock'] = fromBlock
    }
    return this._event.get(network, filter)
  }

  /**
   * Returns trustline updates of loaded user in a currency network. A update
   * happens when an user accepts a trustline update request.
   * @param network address of currency network
   * @param fromBlock start of block range
   */
  public getUpdates (
    network: string,
    { fromBlock }: EventFilterOptions = {}
  ): Promise<TLEvent[]> {
    const filter = { type: 'TrustlineUpdate' }
    if (fromBlock) {
      filter['fromBlock'] = fromBlock
    }
    return this._event.get(network, filter)
  }

  /**
   * Formats number values of trustline retrieved from the relay server.
   * @param trustline unformatted trustline
   * @param decimals decimals currency network
   */
  private _formatTrustline (
    trustline: TrustlineUnformatted,
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
