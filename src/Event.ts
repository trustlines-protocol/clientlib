import { Utils } from './Utils'
import { User } from './User'

import { Observable } from 'rxjs/Observable'

export class Event {

  private validParameters = [ 'type', 'fromBlock', 'toBlock' ]

  constructor (private user: User, private utils: Utils) {
  }

  public eventObservable (networkAddress: string, filter?: object): Observable<any> {
    const { user, utils, validParameters } = this
    const baseUrl = `networks/${networkAddress}/users/0x${user.proxyAddress}/events`
    const parameterUrl = utils.buildUrl(baseUrl, validParameters, filter)
    return utils.createObservable(parameterUrl)
  }

  public get (networkAddress: string, filter?: object): Promise<object[]> {
    const { user, utils, validParameters } = this
    const baseUrl = `networks/${networkAddress}/users/0x${user.proxyAddress}/events`
    const parameterUrl = utils.buildUrl(baseUrl, validParameters, filter)
    return utils.fetchUrl(parameterUrl)
  }

}
