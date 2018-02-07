import { Utils } from './Utils'
import { User } from './User'
import { CurrencyNetwork } from './CurrencyNetwork'

import { Observable } from 'rxjs/Observable'

interface EventFilterOptions {
  type?: string,
  fromBlock?: number,
  toBlock?: number
}

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
    ]).then(([ events, decimals ]) => events.map(e => (e.amount ? ({
      ...e,
      amount: utils.formatAmount(e.amount, decimals)
    }) : e
  )))
  }

  public getAll ({ type, fromBlock, toBlock }: EventFilterOptions = {}): Promise<any[]> {
    const { user, utils } = this
    const baseUrl = `users/${user.address}/events`
    const parameterUrl = utils.buildUrl(baseUrl, { type, fromBlock, toBlock })
    return utils.fetchUrl(parameterUrl)
  }

}
