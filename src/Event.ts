import { Observable } from 'rxjs/Observable'

import { Utils } from './Utils'
import { User } from './User'
import { CurrencyNetwork } from './CurrencyNetwork'

import {
  EventFilterOptions,
  TLEvent
} from './typings'

/**
 * The Event class contains all methods related to retrieving event logs.
 */
export class Event {
  private _currencyNetwork: CurrencyNetwork
  private _user: User
  private _utils: Utils

  constructor (
    user: User,
    utils: Utils,
    currencyNetwork: CurrencyNetwork
  ) {
    this._currencyNetwork = currencyNetwork
    this._user = user
    this._utils = utils
  }

  /**
   * Creates and Observable for events.
   * @param networkAddress address of currency network
   * @param type type of event `TrustlineUpdateRequest`, `TrustlineUpdate` or `Transfer`
   * @param fromBlock start of block range
   */
  public createObservable (
    networkAddress: string,
    { type, fromBlock }: EventFilterOptions = {}
  ): Observable<any> {
    const { _user, _utils } = this
    const baseUrl = `networks/${networkAddress}/users/${_user.address}/events`
    const parameterUrl = _utils.buildUrl(baseUrl, { type, fromBlock })
    return _utils.createObservable(parameterUrl)
  }

  /**
   * Returns event logs of loaded user in a specified currency network.
   * @param networkAddress address of currency network
   * @param type type of event `TrustlineUpdateRequest`, `TrustlineUpdate` or `Transfer`
   * @param fromBlock start of block range
   */
  public async get (
    networkAddress: string,
    { type, fromBlock }: EventFilterOptions = {}
  ): Promise<TLEvent[]> {
    try {
      const { _currencyNetwork, _user, _utils } = this
      const baseUrl = `networks/${networkAddress}/users/${_user.address}/events`
      const parameterUrl = _utils.buildUrl(baseUrl, { type, fromBlock })
      const [ events, decimals ] = await Promise.all([
        _utils.fetchUrl<TLEvent[]>(parameterUrl),
        _currencyNetwork.getDecimals(networkAddress)
      ])
      return events.map(event => _utils.formatEvent(event, decimals))
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Returns event logs of loaded user in all currency networks.
   * @param type type of event `TrustlineUpdateRequest`, `TrustlineUpdate` or `Transfer`
   * @param fromBlock start of block range
   */
  public async getAll ({ type, fromBlock }: EventFilterOptions = {}): Promise<TLEvent[]> {
    try {
      const { _currencyNetwork, _user, _utils } = this
      const baseUrl = `users/${_user.address}/events`
      const parameterUrl = _utils.buildUrl(baseUrl, { type, fromBlock })
      const events = await _utils.fetchUrl<TLEvent[]>(parameterUrl)
      const networks = this._getUniqueNetworksFromEvents(events)
      const decimalsMap = await this._getDecimalsMap(networks)
      return events.map(event => _utils.formatEvent(
        event,
        decimalsMap[event.networkAddress]
      ))
    } catch (error) {
      return Promise.reject(error)
    }
  }

  public updateStream (): Observable<any> {
    return this._utils.websocketStream(
      'streams/events',
      'subscribe',
      {
        'event': 'all',
        'user': this._user.address
      }
    ).mergeMap(event => {
      if (event.hasOwnProperty('networkAddress')) {
        return this._currencyNetwork.getDecimals(event.networkAddress)
          .then(decimals => this._utils.formatEvent(event, decimals))
      } else {
        return Promise.resolve(event)
      }
    })
  }

  /**
   * Returns unique network addresses from a list of event logs.
   * @param events trustlines network events
   */
  private _getUniqueNetworksFromEvents (events: TLEvent[]): string[] {
    const networks = events.map(e => e.networkAddress)
    const set = new Set(networks)
    return Array.from(set)
  }

  /**
   * Returns a mapping from currency network address to decimals
   * @param networks array of unique currency network addresses
   */
  private async _getDecimalsMap (networks: string[]): Promise<object> {
    const decimalsList = await Promise.all(
      networks.map(n => this._currencyNetwork.getDecimals(n))
    )
    return networks.reduce((decimalsMap, network, i) => {
      decimalsMap[network] = decimalsList[i]
      return decimalsMap
    }, {})
  }
}
