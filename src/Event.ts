import { Observable } from 'rxjs/Observable'
import { fromPromise } from 'rxjs/observable/fromPromise'

import { CurrencyNetwork } from './CurrencyNetwork'
import { processExtraData } from './extraData'
import { TLProvider } from './providers/TLProvider'
import { User } from './User'

import utils from './utils'

import {
  AnyEvent,
  AnyEventRaw,
  AnyExchangeEventRaw,
  AnyNetworkEventRaw,
  AnyTokenEventRaw,
  DecimalsOptions,
  EventFilterOptions,
  ReconnectingWSOptions
} from './typings'

const CURRENCY_NETWORK = 'CurrencyNetwork'
const TOKEN = 'Token'

/**
 * The Event class contains all methods related to retrieving event logs.
 * It is meant to be called via a [[TLNetwork]] instance like:
 * ```typescript
 * const tlNetwork = new TLNetwork(
 *  //...
 * )
 *
 * // Get transfer logs
 * tlNetwork.event.get(
 *  // ...
 * ).then(
 *  events => console.log("Events of loaded user:", events)
 * )
 * ```
 */
export class Event {
  private currencyNetwork: CurrencyNetwork
  private provider: TLProvider
  private user: User

  /** @hidden */
  constructor(params: {
    currencyNetwork: CurrencyNetwork
    provider: TLProvider
    user: User
  }) {
    this.currencyNetwork = params.currencyNetwork
    this.provider = params.provider
    this.user = params.user
  }

  /**
   * @hidden
   * Returns event logs of loaded user in a specified currency network.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See [[EventFilterOptions]] for more information.
   * @param filter.type Available event types are `Transfer`, `TrustlineUpdateRequest` and `TrustlineUpdate`.
   * @param filter.fromBlock Start of block range for event logs.
   */
  public async get<T>(
    networkAddress: string,
    filter: EventFilterOptions = {},
    options: {
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<T[]> {
    const baseUrl = `networks/${networkAddress}/users/${await this.user.getAddress()}/events`
    const parameterUrl = utils.buildUrl(baseUrl, { query: filter })
    const [
      events,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.provider.fetchEndpoint<AnyNetworkEventRaw[]>(parameterUrl),
      this.currencyNetwork.getDecimals(
        networkAddress,
        options.decimalsOptions || {}
      )
    ])
    return events.map(event =>
      processExtraData(
        utils.formatEvent<T>(event, networkDecimals, interestRateDecimals)
      )
    )
  }

  /**
   * Returns event logs of loaded user in all currency networks / EthWrappers / Exchanges.
   * @param filter Event filter object. See [[EventFilterOptions]] for more information.
   * @param filter.type Available event types are:
   *                    CurrencyNetwork -> `Transfer`, `TrustlineUpdateRequest` and `TrustlineUpdate`
   *                    EthWrapper -> `Transfer`, `Deposit` and `Withdrawal`
   *                    Exchange -> `LogFill` and `LogCancel`
   * @param filter.contractType Available contract types are `CurrencyNetwork`, `Exchange`, `UnwETH`, `Token`
   * @param filter.fromBlock Start of block range for event logs.
   */
  public async getAll(filter: EventFilterOptions = {}): Promise<AnyEvent[]> {
    const endpoint = `users/${await this.user.getAddress()}/events`
    const parameterUrl = utils.buildUrl(endpoint, { query: filter })
    const events = await this.provider.fetchEndpoint<AnyEventRaw[]>(
      parameterUrl
    )
    return (await this.setDecimalsAndFormat(events)).map(event =>
      processExtraData(event)
    )
  }

  /**
   * @hidden
   */
  public updateStream(
    reconnectingOptions?: ReconnectingWSOptions
  ): Observable<any> {
    return fromPromise(this.user.getAddress()).flatMap(userAddress =>
      this.provider
        .createWebsocketStream(
          'streams/events',
          'subscribe',
          {
            event: 'all',
            user: userAddress
          },
          reconnectingOptions
        )
        .mergeMap(event => {
          if (event.hasOwnProperty('networkAddress')) {
            return this.currencyNetwork
              .getDecimals(event.networkAddress)
              .then(({ networkDecimals, interestRateDecimals }) =>
                processExtraData(
                  utils.formatEvent(
                    event,
                    networkDecimals,
                    interestRateDecimals
                  )
                )
              )
          } else {
            return Promise.resolve(event)
          }
        })
    )
  }

  /**
   * @hidden
   * Fetches decimals for given event logs and formats them so that all numerical
   * values are `Amount` objects.
   * @param rawEvents trustlines network events
   */
  public async setDecimalsAndFormat(rawEvents: AnyEventRaw[]): Promise<any[]> {
    const addressesMap = this._getUniqueAddressesMap(rawEvents)
    const decimalsMap = await this.getDecimalsMap(addressesMap)
    return rawEvents.map(event => {
      if ((event as AnyNetworkEventRaw).networkAddress) {
        return utils.formatEvent<AnyNetworkEventRaw>(
          event,
          decimalsMap[(event as AnyNetworkEventRaw).networkAddress]
            .networkDecimals,
          decimalsMap[(event as AnyNetworkEventRaw).networkAddress]
            .interestRateDecimals
        )
      }
      if ((event as AnyTokenEventRaw).tokenAddress) {
        return utils.formatEvent<AnyTokenEventRaw>(
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
        return utils.formatExchangeEvent(
          event as AnyExchangeEventRaw,
          decimalsMap[makerTokenAddress].networkDecimals,
          decimalsMap[takerTokenAddress].networkDecimals
        )
      }
      return event
    })
  }

  /**
   * @hidden
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
