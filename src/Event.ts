import { Utils } from './Utils'
import { User } from './User'

import { Observable } from 'rxjs/Observable'

export class Event {

  private validParameters = [ 'type', 'fromBlock', 'toBlock' ]

  constructor (private user: User, private utils: Utils) {
  }

  public createObservable (networkAddress: string, filter?: object): Observable<any> {
    const { user, utils, validParameters } = this
    const baseUrl = `networks/${networkAddress}/users/${user.address}/events`
    const parameterUrl = utils.buildUrl(baseUrl, validParameters, filter)
    return utils.createObservable(parameterUrl)
  }

  public get (networkAddress: string, filter?: object): Promise<any[]> {
    const { user, utils, validParameters } = this
    const baseUrl = `networks/${networkAddress}/users/${user.address}/events`
    const parameterUrl = utils.buildUrl(baseUrl, validParameters, filter)
    return utils.fetchUrl(parameterUrl)
  }

  public getAll (filter?: object): Promise<any[]> {
    const { user, utils, validParameters } = this
    const baseUrl = `users/${user.address}/events`
    const parameterUrl = utils.buildUrl(baseUrl, validParameters, filter)
    return utils.fetchUrl(parameterUrl)
  }

}
