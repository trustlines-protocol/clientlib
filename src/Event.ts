import { Observable } from 'rxjs/Observable'

import { Utils } from './Utils'
import { User } from './User'
import { CurrencyNetwork } from './CurrencyNetwork'

import {
  EventFilterOptions,
  AnyNetworkEvent,
  AnyNetworkEventRaw,
  AnyEvent,
  AnyEventRaw,
  AnyTokenEventRaw
} from './typings'

const CURRENCY_NETWORK_EVENT = 'CurrencyNetworkEvent'
const TOKEN_EVENT = 'TokenEvent'

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
   * Returns event logs of loaded user in a specified currency network.
   * @param networkAddress Address of a currency network.
   * @param type Type of event `TrustlineUpdateRequest`, `TrustlineUpdate` or `Transfer`.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public async get<T> (
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<T[]> {
    const { _currencyNetwork, _user, _utils } = this
    const baseUrl = `networks/${networkAddress}/users/${_user.address}/events`
    const parameterUrl = _utils.buildUrl(baseUrl, filter)
    const [ events, decimals ] = await Promise.all([
      _utils.fetchUrl<AnyNetworkEventRaw[]>(parameterUrl),
      _currencyNetwork.getDecimals(networkAddress)
    ])
    return events.map(event => _utils.formatEvent<T>(event, decimals))
  }

  /**
   * Returns event logs of loaded user in all currency networks.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public async getAll (filter: EventFilterOptions = {}): Promise<AnyEvent[]> {
    const { _user, _utils } = this
    const baseUrl = `users/${_user.address}/events`
    const parameterUrl = _utils.buildUrl(baseUrl, filter)
    const events = await _utils.fetchUrl<AnyEventRaw[]>(parameterUrl)
    const addressesMap = this._getUniqueAddressesMap(events)
    const decimalsMap = await this._getDecimalsMap(addressesMap)
    return events.map(event => {
      const address = (event as AnyNetworkEventRaw).networkAddress ||
                      (event as AnyTokenEventRaw).tokenAddress
      return _utils.formatEvent(event, decimalsMap[address])
    })
  }

  /**
   * @hidden
   */
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
   * Returns unique addresses from a list of event logs and maps to the event type.
   * Currently there are `NetworkEvent` and `TokenEvent`.
   * @param events trustlines network events
   */
  private _getUniqueAddressesMap (events: AnyEventRaw[]): object {
    return events.reduce((result, e) => {
      if ((e as AnyNetworkEventRaw).networkAddress) {
        result[(e as AnyNetworkEventRaw).networkAddress] = CURRENCY_NETWORK_EVENT
      } else if ((e as AnyTokenEventRaw).tokenAddress) {
        result[(e as AnyTokenEventRaw).tokenAddress] = TOKEN_EVENT
      }
      return result
    }, {})
  }

  /**
   * Returns a mapping from address to decimals
   * @param addressesMap mapping from address to event type
   */
  private async _getDecimalsMap (addressesMap: object): Promise<object> {
    const addresses = Object.keys(addressesMap)
    const decimalsList = await Promise.all(
      addresses.map(address => {
        if (addressesMap[address] === CURRENCY_NETWORK_EVENT) {
          return this._currencyNetwork.getDecimals(address)
        }
        if (addressesMap[address] === TOKEN_EVENT) {
          // NOTE: only expecting WrappedEthEvents for now
          return this._currencyNetwork.getDecimals(address, 18)
        }
      })
    )
    return addresses.reduce((decimalsMap, network, i) => {
      decimalsMap[network] = decimalsList[i]
      return decimalsMap
    }, {})
  }
}
