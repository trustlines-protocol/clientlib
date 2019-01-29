import { Observable } from 'rxjs/Observable'

import { CurrencyNetwork } from './CurrencyNetwork'
import { User } from './User'
import { Utils } from './Utils'

import {
  AnyEvent,
  AnyEventRaw,
  AnyExchangeEventRaw,
  AnyNetworkEventRaw,
  AnyTokenEventRaw,
  EventFilterOptions
} from './typings'

const CURRENCY_NETWORK = 'CurrencyNetwork'
const TOKEN = 'Token'

/**
 * The Event class contains all methods related to retrieving event logs.
 */
export class Event {
  private currencyNetwork: CurrencyNetwork
  private user: User
  private utils: Utils

  private relayApiUrl: string
  private relayWsApiUrl: string

  constructor(
    user: User,
    utils: Utils,
    currencyNetwork: CurrencyNetwork,
    relayApiUrl: string,
    relayWsApiUrl: string
  ) {
    this.currencyNetwork = currencyNetwork
    this.user = user
    this.utils = utils
    this.relayApiUrl = relayApiUrl
    this.relayWsApiUrl = relayWsApiUrl
  }

  /**
   * @hidden
   * Returns event logs of loaded user in a specified currency network.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   * @param filter.type Available event types are `Transfer`, `TrustlineUpdateRequest` and `TrustlineUpdate`.
   * @param filter.fromBlock Start of block range for event logs.
   */
  public async get<T>(
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<T[]> {
    const baseUrl = `${this.relayApiUrl}/networks/${networkAddress}/users/${
      this.user.address
    }/events`
    const parameterUrl = this.utils.buildUrl(baseUrl, filter)
    const [
      events,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.utils.fetchUrl<AnyNetworkEventRaw[]>(parameterUrl),
      this.currencyNetwork.getDecimals(networkAddress)
    ])
    return events.map(event =>
      this.utils.formatEvent<T>(event, networkDecimals, interestRateDecimals)
    )
  }

  /**
   * Returns event logs of loaded user in all currency networks.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   * @param filter.type Available event types are:
   *                    CurrencyNetwork -> `Transfer`, `TrustlineUpdateRequest` and `TrustlineUpdate`
   *                    EthWrapper -> `Transfer`, `Deposit` and `Withdrawal`
   *                    Exchange -> `LogFill` and `LogCancel`
   * @param filter.fromBlock Start of block range for event logs.
   */
  public async getAll(filter: EventFilterOptions = {}): Promise<AnyEvent[]> {
    const baseUrl = `${this.relayApiUrl}/users/${this.user.address}/events`
    const parameterUrl = this.utils.buildUrl(baseUrl, filter)
    const events = await this.utils.fetchUrl<AnyEventRaw[]>(parameterUrl)
    return this.setDecimalsAndFormat(events)
  }

  /**
   * @hidden
   */
  public updateStream(): Observable<any> {
    return this.utils
      .websocketStream(`${this.relayWsApiUrl}/streams/events`, 'subscribe', {
        event: 'all',
        user: this.user.address
      })
      .mergeMap(event => {
        if (event.hasOwnProperty('networkAddress')) {
          return this.currencyNetwork
            .getDecimals(event.networkAddress)
            .then(({ networkDecimals, interestRateDecimals }) =>
              this.utils.formatEvent(
                event,
                networkDecimals,
                interestRateDecimals
              )
            )
        } else {
          return Promise.resolve(event)
        }
      })
  }

  /**
   * Fetches decimals for given event logs and formats them so that all numerical
   * values are `Amount` objects.
   * @param rawEvents trustlines network events
   */
  public async setDecimalsAndFormat(rawEvents: AnyEventRaw[]): Promise<any[]> {
    const addressesMap = this._getUniqueAddressesMap(rawEvents)
    const decimalsMap = await this.getDecimalsMap(addressesMap)
    return rawEvents.map(event => {
      if ((event as AnyNetworkEventRaw).networkAddress) {
        return this.utils.formatEvent<AnyNetworkEventRaw>(
          event,
          decimalsMap[(event as AnyNetworkEventRaw).networkAddress]
            .networkDecimals,
          decimalsMap[(event as AnyNetworkEventRaw).networkAddress]
            .interestRateDecimals
        )
      }
      if ((event as AnyTokenEventRaw).tokenAddress) {
        return this.utils.formatEvent<AnyTokenEventRaw>(
          event,
          decimalsMap[(event as AnyTokenEventRaw).tokenAddress].networkDecimals,
          decimalsMap[(event as AnyTokenEventRaw).tokenAddress]
            .interestRateDecimals
        )
      }
      if ((event as AnyExchangeEventRaw).exchangeAddress) {
        const {
          makerTokenAddress,
          takerTokenAddress
        } = event as AnyExchangeEventRaw
        return this.utils.formatExchangeEvent(
          event as AnyExchangeEventRaw,
          decimalsMap[makerTokenAddress].networkDecimals,
          decimalsMap[takerTokenAddress].networkDecimals
        )
      }
      return event
    })
  }

  /**
   * Returns a mapping from address to decimals
   * @param addressesMap mapping from address to whether given address is a CurrencyNetwork
   *                     or Token contract.
   */
  public async getDecimalsMap(addressesMap: object): Promise<object> {
    const addresses = Object.keys(addressesMap)
    const decimalsList = await Promise.all(
      addresses.map(address => {
        if (addressesMap[address] === CURRENCY_NETWORK) {
          return this.currencyNetwork.getDecimals(address)
        }
        if (addressesMap[address] === TOKEN) {
          // TODO: find different way to get decimals of token
          // NOTE: only expecting WrappedEthEvents for now
          return this.currencyNetwork.getDecimals(address, {
            interestRateDecimals: 0,
            networkDecimals: 18
          })
        }
      })
    )
    return addresses.reduce((decimalsMap, network, i) => {
      decimalsMap[network] = decimalsList[i]
      return decimalsMap
    }, {})
  }

  /**
   * Returns unique addresses from a list of event logs and maps to whether the address
   * is a CurrencyNetwork or Token contract.
   * @param events trustlines network events
   */
  private _getUniqueAddressesMap(events: AnyEventRaw[]): object {
    return events.reduce((result, e) => {
      if ((e as AnyNetworkEventRaw).networkAddress) {
        result[(e as AnyNetworkEventRaw).networkAddress] = CURRENCY_NETWORK
      } else if ((e as AnyTokenEventRaw).tokenAddress) {
        result[(e as AnyTokenEventRaw).tokenAddress] = TOKEN
      } else if ((e as AnyExchangeEventRaw).exchangeAddress) {
        const {
          makerTokenAddress,
          takerTokenAddress
        } = e as AnyExchangeEventRaw
        if (!result[makerTokenAddress]) {
          result[makerTokenAddress] = this.currencyNetwork.isNetwork(
            makerTokenAddress
          )
            ? CURRENCY_NETWORK
            : TOKEN
        }
        if (!result[takerTokenAddress]) {
          result[takerTokenAddress] = this.currencyNetwork.isNetwork(
            takerTokenAddress
          )
            ? CURRENCY_NETWORK
            : TOKEN
        }
      }
      return result
    }, {})
  }
}
