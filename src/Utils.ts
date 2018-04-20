import { Observable } from 'rxjs/Observable'
import { TimerObservable } from 'rxjs/observable/TimerObservable'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/map'
import { Observer } from 'rxjs/Observer'
import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'

import { Configuration } from './Configuration'

let __DEV__

const ReconnectingWebSocket = require('reconnecting-websocket')
const JsonRPC = require('simple-jsonrpc-js')
const WebSocket = require('html5-websocket')

export class Utils {

  constructor (private configuration: Configuration) {
  }

  public createObservable (url: string): Observable<any> {
    const { useWebSockets, apiUrl, wsApiUrl, pollInterval } = this.configuration
    if (useWebSockets && 'WebSocket' in window) {
      return Observable.create((observer: Observer<any>) => {
        let ws = new ReconnectingWebSocket(`${wsApiUrl}${url}`)
        ws.onmessage = (e: MessageEvent) => {
          const json = JSON.parse(e.data)
          observer.next(json)
        }
        ws.onerror = (e: ErrorEvent) => {
          console.error('An web socket error occured')
        }
        return () => {
          ws.close(1000, '', { keepClosed: true })
        }
      })
    } else {
      return TimerObservable.create(0, pollInterval)
        .mergeMap(() =>
          fetch(`${apiUrl}${url}`)
            .then(res => res.json())
            .catch(err => new Error(`Could not get events: ${err.message}`))
        )
    }
  }

  public fetchUrl (url: string, options?: object): Promise<any> {
    const { apiUrl } = this.configuration
    const completeUrl = `${apiUrl}${url}`
    return fetch(completeUrl, options)
      .then(response => {
        if (response.status !== 200) {
          return response.json().then(json =>
            Promise.reject(new Error('Status ' + response.status + ': ' + json.message))
          )
        } else {
          return response.json()
        }
      })
      .then(json => {
        return json
      })
      .catch(error => {
        const message = 'There was an error fetching ' + completeUrl + ' | ' + (error && error.message)
        return Promise.reject(new Error(message))
      })
  }

  public websocketStream (endpoint: String, functionName: String, args: object): Observable<any> {
    const { wsApiUrl } = this.configuration
    return Observable.create((observer: Observer<any>) => {
      const options = {constructor: WebSocket}
      const ws = new ReconnectingWebSocket(`${wsApiUrl}${endpoint}`, undefined, options)
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

  public createLink (params: any[]): string {
    const base = 'http://trustlines.network/v1'
    return this.buildUrl(base, params)
  }

  public calcRaw (value: number | string, decimals: number): any {
    const x = new BigNumber(value)
    return x.times(Math.pow(10, decimals)).toNumber()
  }

  public calcValue (raw: number | string, decimals: number): any {
    const x = new BigNumber(raw)
    return x.div(Math.pow(10, decimals)).toNumber()
  }

  public formatAmount (raw: number | string, decimals: number): any {
    return {
      decimals,
      raw,
      value: this.calcValue(raw, decimals)
    }
  }

  public formatEvent (event: any, decimals: number): any {
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

  public checkAddress (address: string): boolean {
    if (/[A-Z]/.test(address)) {
      return ethUtils.isValidChecksumAddress(address)
    } else {
      return ethUtils.isValidAddress(address)
    }
  }

  public convertEthToWei (value: number | string): number {
    const eth = new BigNumber(value)
    const wei = new BigNumber(1000000000000000000)
    return eth.times(wei).toNumber()
  }
}
