import { Observable } from 'rxjs/Observable'
import { TimerObservable } from 'rxjs/observable/TimerObservable'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/map'
import { Observer } from 'rxjs/Observer'
import { BigNumber } from 'bignumber.js'

import { Configuration } from './Configuration'

let __DEV__

const ReconnectingWebSocket = require('reconnecting-websocket')

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
    if (__DEV__) {
      console.log(`Request: ${apiUrl}${url}`, options)
    }
    return fetch(`${apiUrl}${url}`, options)
      .then(response => {
        if (__DEV__) {
          console.log(`Response: ${apiUrl}${url}`, response)
        }
        if (response.status !== 200) {
          return response.json().then(json =>
            Promise.reject(json.message)
          )
        } else {
          return response.json()
        }
      })
      .then(json => json)
      .catch(error => Promise.reject(error.message || error))
  }

  public buildUrl (baseUrl: string, validParameters: string[], parameters?: any): string {
    if (!parameters || typeof parameters !== 'object') {
      return baseUrl
    }
    for (let key in parameters) {
      if (parameters[ key ] && validParameters.indexOf(key) !== -1) {
        baseUrl += (baseUrl.indexOf('?') === -1) ? '?' : '&'
        baseUrl += `${key}=${parameters[ key ]}`
      }
    }
    return baseUrl
  }

  public createLink (pre: string, parameters: any[]): string {
    const base = `http://trustlines.network/v1/${pre}/`
    const link = parameters.reduce((result, param) => `${result}/${param}`)
    return base + link
  }

  public checkAddress (address: string): boolean {
    return /^(0x)?[0-9a-f]{40}$/i.test(address)
    // TODO also use checksum address
  }

  public calcRaw (value: number, decimals: number): any {
    const x = new BigNumber(value)
    return x.times(Math.pow(10, decimals)).toNumber()
  }

  public calcValue (raw: number, decimals: number): any {
    const x = new BigNumber(raw)
    return x.div(Math.pow(10, decimals)).toNumber()
  }

  public formatAmount (raw: number, decimals: number): object {
    return {
      decimals,
      raw,
      value: this.calcValue(raw, decimals)
    }
  }
}
