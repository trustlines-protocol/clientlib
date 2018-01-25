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
    return `${base}${link}`
  }

  public calcRaw (value: number, decimals: number): any {
    const x = new BigNumber(value)
    return x.times(Math.pow(10, decimals)).toNumber()
  }

  public calcValue (raw: number, decimals: number): any {
    const x = new BigNumber(raw)
    return x.div(Math.pow(10, decimals)).toNumber()
  }

  public formatAmount (raw: number, decimals: number): any {
    return {
      decimals,
      raw,
      value: this.calcValue(raw, decimals)
    }
  }

  public checkAddress (address: string): boolean {
    if (/[A-Z]/.test(address)) {
      return ethUtils.isValidChecksumAddress(address)
    } else {
      return ethUtils.isValidAddress(address)
    }
  }

  public convertEthToWei (value: number): number {
    const eth = new BigNumber(value)
    const wei = new BigNumber(1000000000000000000)
    return eth.times(wei).toNumber()
  }
}
