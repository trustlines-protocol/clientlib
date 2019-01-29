import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'
import * as WebSocket from 'html5-websocket'
import * as ReconnectingWebSocket from 'reconnecting-websocket'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import { Observable } from 'rxjs/Observable'
import { Observer } from 'rxjs/Observer'
import * as JsonRPC from 'simple-jsonrpc-js'

import {
  Amount,
  AmountInternal,
  AnyExchangeEvent,
  AnyExchangeEventRaw,
  ExchangeCancelEventRaw,
  ExchangeFillEventRaw
} from './typings'

if (
  typeof module !== 'undefined' &&
  module.exports &&
  typeof crypto === 'undefined'
) {
  // crypto not available
  console.warn('Random numbers will not be cryptographically secure')
} else {
  BigNumber.config({ CRYPTO: true })
}

/**
 * The Utils class contains utility functions that are used in multiple classes.
 */
export class Utils {
  /**
   * Returns a `Promise` with a JSON object from given URL.
   * @param url
   * @param options (optional)
   */
  public async fetchUrl<T>(url: string, options?: object): Promise<T> {
    const response = await fetch(url, options)
    const json = await response.json()
    if (response.status !== 200) {
      throw new Error(
        `Error fetching ${url} | Status ${response.status} | ${json.message}`
      )
    } else {
      return json
    }
  }

  /**
   * Returns an Observable for a websocket stream.
   * @param url URL to open websocket stream to.
   * @param functionName Name of function to call on opened websocket.
   * @param args Arguments for above function.
   */
  public websocketStream(
    url: string,
    functionName: string,
    args: object
  ): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      const options = { constructor: WebSocket }
      const ws = new ReconnectingWebSocket(url, undefined, options)
      const jrpc = new JsonRPC()

      jrpc.toStream = (message: string) => {
        ws.send(message)
      }

      ws.onmessage = (e: MessageEvent) => {
        jrpc.messageHandler(e.data)
      }

      ws.onerror = (e: ErrorEvent) => {
        console.log('An web socket error occured: ' + e.message)
      }

      ws.onopen = () => {
        observer.next({ type: 'WebsocketOpen' })
        jrpc.call(functionName, args).then((subscriptionId: string) => {
          jrpc.on(`subscription_${subscriptionId}`, ['event'], event => {
            observer.next(event)
          })
        })
        if (functionName === 'listen') {
          jrpc.call('getMissedMessages', args).then(events => {
            events.map(event => {
              observer.next(event)
            })
          })
        }
      }

      return () => {
        ws.close(1000, '', { keepClosed: true })
      }
    })
  }

  /**
   * Encodes URI components and returns a URL.
   * @param baseUrl base URL
   * @param params (optional) parameters for queries
   */
  public buildUrl(baseUrl: string, params?: any): string {
    if (Array.isArray(params)) {
      baseUrl = params.reduce(
        (acc, param) => `${acc}/${encodeURIComponent(param)}`,
        baseUrl
      )
    } else if (typeof params === 'object') {
      for (const key in params) {
        if (params[key]) {
          const param = encodeURIComponent(params[key])
          baseUrl += baseUrl.indexOf('?') === -1 ? '?' : '&'
          baseUrl += `${key}=${param}`
        }
      }
    }
    return baseUrl
  }

  /**
   * Returns a trustlines.network link.
   * @param params parameters for link
   */
  public createLink(params: any[]): string {
    const base = 'http://trustlines.network/v1'
    return this.buildUrl(base, params)
  }

  /**
   * Returns the smallest representation of a number.
   * @param value Representation of number in biggest unit.
   * @param decimals Number of decimals.
   */
  public calcRaw(
    value: number | string | BigNumber,
    decimals: number
  ): BigNumber {
    const factor = new BigNumber(10).exponentiatedBy(decimals)
    return new BigNumber(value).multipliedBy(factor)
  }

  /**
   * Returns the biggest representation of a number.
   * @param raw Representation of number in smallest unit.
   * @param decimals Number of decimals.
   */
  public calcValue(
    raw: number | string | BigNumber,
    decimals: number
  ): BigNumber {
    const divisor = new BigNumber(10).exponentiatedBy(decimals)
    return new BigNumber(raw).dividedBy(divisor)
  }

  /**
   * Formats number into an AmountInternal object which is intended for internal use.
   * @param raw Representation of number in smallest unit.
   * @param decimals Number of decimals.
   */
  public formatToAmountInternal(
    raw: number | string | BigNumber,
    decimals: number
  ): AmountInternal {
    return {
      decimals,
      raw: new BigNumber(raw),
      value: this.calcValue(raw, decimals)
    }
  }

  /**
   * Converts an AmountInternal to Amount object.
   * @param amount AmountInternal object.
   */
  public convertToAmount(amount: AmountInternal): Amount {
    return {
      ...amount,
      raw: amount.raw.toString(),
      value: amount.value.toString()
    }
  }

  /**
   * Formats raw representation of number into a Amount object.
   * @param raw Representation of number in smallest unit.
   * @param decimals Number of decimals.
   */
  public formatToAmount(
    raw: number | string | BigNumber,
    decimals: number
  ): Amount {
    return {
      decimals,
      raw: new BigNumber(raw).toString(),
      value: this.calcValue(raw, decimals).toString()
    }
  }

  /**
   * Formats the number values of a raw event returned by the relay.
   * @param event raw event
   * @param networkDecimals decimals of currency network
   * @param interestRateDecimals interest rate decimals of currency network
   */
  public formatEvent<T>(
    event: any,
    networkDecimals: number,
    interestRateDecimals: number
  ): T {
    // key names whose values are numerics and should get formatted
    const keys = [
      'amount',
      'balance',
      'given',
      'received',
      'leftGiven',
      'leftReceived',
      'interestRateGiven',
      'interestRateReceived'
    ]
    for (const key of keys) {
      if (event[key]) {
        event[key] = this.formatToAmount(
          event[key],
          key.includes('interestRate') ? interestRateDecimals : networkDecimals
        )
      }
    }
    return event
  }

  /**
   * Formats the number values of a raw Exchange event as returned by the relay.
   * @param exchangeEvent raw exchange event: `LogFill` or `LogCancel`
   * @param makerDecimals decimals in maker token
   * @param takerDecimals decimals in taker token
   */
  public formatExchangeEvent(
    exchangeEvent: AnyExchangeEventRaw,
    makerDecimals: number,
    takerDecimals: number
  ): AnyExchangeEvent {
    if (exchangeEvent.type === 'LogFill') {
      const fillEventRaw = exchangeEvent as ExchangeFillEventRaw
      return {
        ...fillEventRaw,
        filledMakerAmount: this.formatToAmount(
          fillEventRaw.filledMakerAmount,
          makerDecimals
        ),
        filledTakerAmount: this.formatToAmount(
          fillEventRaw.filledTakerAmount,
          takerDecimals
        )
      }
    } else if (exchangeEvent.type === 'LogCancel') {
      const cancelEventRaw = exchangeEvent as ExchangeCancelEventRaw
      return {
        ...cancelEventRaw,
        cancelledMakerAmount: this.formatToAmount(
          cancelEventRaw.cancelledMakerAmount,
          makerDecimals
        ),
        cancelledTakerAmount: this.formatToAmount(
          cancelEventRaw.cancelledTakerAmount,
          takerDecimals
        )
      }
    }
    throw new Error('Provided event is not a ExchangeEvent!')
  }

  /**
   * Checks if given address is a valid address
   * @param address ethereum address
   */
  public checkAddress(address: string): boolean {
    if (/[A-Z]/.test(address)) {
      return ethUtils.isValidChecksumAddress(address)
    } else {
      return ethUtils.isValidAddress(address)
    }
  }

  /**
   * Converts eth to wei
   * @param value value in eth
   */
  public convertEthToWei(value: number | string): number {
    const eth = new BigNumber(value)
    const wei = new BigNumber(1000000000000000000)
    return eth.times(wei).toNumber()
  }

  /**
   * Returns the hexdecimal representation of given decimal string. The value has to be an integer.
   * @param decimalStr Decimal string representation of number.
   */
  public convertToHexString(decimalStr: string | number | BigNumber): string {
    const bigNumber = new BigNumber(decimalStr)
    if (!bigNumber.isInteger()) {
      // Non integers values can not be processed by ethereum
      throw new Error('Can not convert non integer: ' + bigNumber.toString())
    }
    const hexStr = bigNumber.toString(16)
    return ethUtils.addHexPrefix(hexStr)
  }

  /**
   * Generates a random number with specified decimals.
   * @param decimals Decimals which determine size of generated number.
   */
  public generateRandomNumber(decimals: number): BigNumber {
    return BigNumber.random(decimals + 1)
      .multipliedBy(new BigNumber(10).pow(decimals))
      .integerValue()
  }

  /**
   * Checks if given string is a valid url.
   * @param str String to check.
   */
  public isURL(str) {
    const pattern = new RegExp(
      '^(https?:\\/\\/)?' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    ) // fragment locator
    return pattern.test(str)
  }

  /**
   * Returns URL by concatenating protocol, host, port and path.
   * @param protocol relay api endpoint protocol
   * @param host relay api host address
   * @param port relay api port
   * @param path relay api base endpoint
   */
  public buildApiUrl(
    protocol: string,
    host: string,
    port: number | string,
    path: string
  ): string {
    return `${protocol}://${host}${port && `:${port}`}${path &&
      `/${this._trimUrl(path)}`}`
  }

  /**
   * Adds a slash to the endpoint if it does not start with it.
   * @param endpoint Endpoint to format.
   */
  private _formatEndpoint(endpoint: string): string {
    if (endpoint[0] !== '/') {
      return `/${endpoint}`
    }
    return endpoint
  }

  /**
   * Trims url from slashes.
   * @param url URL to be trimmed from slashes.
   */
  private _trimUrl(url: string): string {
    return url
      .split('/')
      .filter(split => split)
      .join('/')
  }
}
