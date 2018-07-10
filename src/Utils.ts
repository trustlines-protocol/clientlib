import { Observable } from 'rxjs/Observable'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/map'
import { Observer } from 'rxjs/Observer'
import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'

import { Configuration } from './Configuration'
import { Amount } from './typings'

let __DEV__

const ReconnectingWebSocket = require('reconnecting-websocket')
const JsonRPC = require('simple-jsonrpc-js')
const WebSocket = require('html5-websocket')

/**
 * The Utils class contains utility functions that are used in multiple classes.
 */
export class Utils {

  private _apiUrl: string
  private _wsApiUrl: string

  constructor (configuration: Configuration) {
    this._apiUrl = configuration.apiUrl
    this._wsApiUrl = configuration.wsApiUrl
  }

  /**
   * Generic function for fetching a endpoint
   * @param endpoint fetch endpoint
   * @param options (optional)
   */
  public async fetchUrl<T> (endpoint: string, options?: object): Promise<T> {
    const fullUrl = `${this._apiUrl}${endpoint}`
    const response = await fetch(fullUrl, options)
    const json = await response.json()
    if (response.status !== 200) {
      throw new Error(`${fullUrl} | Status ${response.status} | ${json.message}`)
    } else {
      return json
    }
  }

  public websocketStream (endpoint: String, functionName: String, args: object): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      const options = {constructor: WebSocket}
      const ws = new ReconnectingWebSocket(`${this._wsApiUrl}${endpoint}`, undefined, options)
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
          jrpc.on(`subscription_${subscriptionId}`, ['event'], (event) => {
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
  public buildUrl (baseUrl: string, params?: any): string {
    if (Array.isArray(params)) {
      baseUrl = params.reduce((acc, param) => `${acc}/${encodeURIComponent(param)}`, baseUrl)
    } else if (typeof params === 'object') {
      for (let key in params) {
        if (params[key]) {
          const param = encodeURIComponent(params[key])
          baseUrl += (baseUrl.indexOf('?') === -1) ? '?' : '&'
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
  public createLink (params: any[]): string {
    const base = 'http://trustlines.network/v1'
    return this.buildUrl(base, params)
  }

  /**
   * Returns the smallest representation of a number.
   * @param value Representation of number in biggest unit.
   * @param decimals Number of decimals.
   */
  public calcRaw (value: number | string, decimals: number): string {
    const factor = new BigNumber(10).exponentiatedBy(decimals)
    return new BigNumber(value).multipliedBy(factor).toString()
  }

  /**
   * Returns the biggest representation of a number.
   * @param raw Representation of number in smallest unit.
   * @param decimals Number of decimals.
   */
  public calcValue (raw: number | string, decimals: number): string {
    const divisor = new BigNumber(10).exponentiatedBy(decimals)
    return new BigNumber(raw).dividedBy(divisor).toString()
  }

  /**
   * Formats number into an Amount object which includes the decimals,
   * smallest and biggest representation.
   * @param raw representation of number in smallest unit
   * @param decimals nubmer of decimals
   */
  public formatAmount (raw: number | string, decimals: number): Amount {
    return {
      decimals,
      raw: new BigNumber(raw).toString(),
      value: this.calcValue(raw, decimals)
    }
  }

  /**
   * Formats the number values of a raw event returned by the relay.
   * @param event raw event
   * @param decimals nubmer of decimals
   */
  public formatEvent<T> (event: any, decimals: number): T {
    if (event.amount) {
      event = {
        ...event,
        amount: this.formatAmount(event.amount, decimals)
      }
    }

    if (event.balance) {
      event = {
        ...event,
        balance: this.formatAmount(event.balance, decimals)
      }
    }

    if (event.received && event.given) {
      event = {
        ...event,
        given: this.formatAmount(event.given, decimals),
        received: this.formatAmount(event.received, decimals)
      }
    }

    if (event.leftReceived && event.leftGiven) {
      event = {
        ...event,
        leftGiven: this.formatAmount(event.leftGiven, decimals),
        leftReceived: this.formatAmount(event.leftReceived, decimals)
      }
    }
    return event
  }

  /**
   * Checks if given address is a valid address
   * @param address ethereum address
   */
  public checkAddress (address: string): boolean {
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
  public convertEthToWei (value: number | string): number {
    const eth = new BigNumber(value)
    const wei = new BigNumber(1000000000000000000)
    return eth.times(wei).toNumber()
  }

  /**
   * Returns the hexdecimal representation of given decimal string.
   * @param decimalStr Decimal string representation of number.
   */
  public convertDecToHex (decimalStr: string): string {
    return new BigNumber(decimalStr).toString(16)
  }
}
