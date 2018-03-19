import { Utils } from './Utils'
import { User } from './User'
import { CurrencyNetwork } from './CurrencyNetwork'
import { EventFilterOptions } from './typings'

import { Observable } from 'rxjs/Observable'

export class Event {
  constructor (private user: User, private utils: Utils, private currencyNetwork: CurrencyNetwork) {
  }

  public createObservable (
    networkAddress: string,
    { type, fromBlock, toBlock }: EventFilterOptions = {}
  ): Observable<any> {
    const { user, utils } = this
    const baseUrl = `networks/${networkAddress}/users/${user.address}/events`
    const parameterUrl = utils.buildUrl(baseUrl, { type, fromBlock, toBlock })
    return utils.createObservable(parameterUrl)
  }

  public get (
    networkAddress: string,
    { type, fromBlock, toBlock }: EventFilterOptions = {}
  ): Promise<any[]> {
    const { user, utils } = this
    const baseUrl = `networks/${networkAddress}/users/${user.address}/events`
    const parameterUrl = utils.buildUrl(baseUrl, { type, fromBlock, toBlock })
    return Promise.all([
      utils.fetchUrl(parameterUrl),
      this.currencyNetwork.getDecimals(networkAddress)
    ]).then(([ events, decimals ]) => events.map(e => {
      if (e.amount) {
        return {
          ...e,
          amount: utils.formatAmount(e.amount, decimals)
        }
      } else if (e.received && e.given) {
        return {
          ...e,
          given: utils.formatAmount(e.given, decimals),
          received: utils.formatAmount(e.received, decimals)
        }
      } else {
        return e
      }
    }))
  }

  public getAll ({ type, fromBlock, toBlock }: EventFilterOptions = {}): Promise<any[]> {
    const { user, utils } = this
    const baseUrl = `users/${user.address}/events`
    const parameterUrl = utils.buildUrl(baseUrl, { type, fromBlock, toBlock })
    return utils.fetchUrl(parameterUrl)
  }

  public stream (): Observable<any> {
    const { user, utils } = this
    return this.utils.eventStream('all', user.address)
  }

}
