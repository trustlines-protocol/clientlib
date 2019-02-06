import { Observable } from 'rxjs/Observable'

import { TLProvider } from './TLProvider'

import utils from '../utils'

export class RelayProvider implements TLProvider {
  public relayApiUrl: string
  public relayWsApiUrl: string

  constructor(relayApiUrl: string, relayWsApiUrl: string) {
    this.relayApiUrl = relayApiUrl
    this.relayWsApiUrl = relayWsApiUrl
  }

  public async fetchEndpoint<T>(
    endpoint: string,
    options?: object
  ): Promise<T> {
    const trimmedEndpoint = utils.trimUrl(endpoint)
    return utils.fetchUrl<T>(`${this.relayApiUrl}/${trimmedEndpoint}`, options)
  }

  public createWebsocketStream(
    endpoint: string,
    functionName: string,
    args: object
  ): Observable<any> {
    const trimmedEndpoint = utils.trimUrl(endpoint)
    return utils.websocketStream(
      `${this.relayWsApiUrl}/${trimmedEndpoint}`,
      functionName,
      args
    )
  }
}
