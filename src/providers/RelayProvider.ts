import { TLProvider } from './TLProvider'

import { fetchUrl, trimUrl } from '../utils'

export class RelayProvider implements TLProvider {
  public relayApiUrl: string
  public relayWsApiUrl: string

  constructor(relayApiUrl: string, relayWsApiUrl: string) {
    this.relayApiUrl = trimUrl(relayApiUrl)
    this.relayWsApiUrl = trimUrl(relayWsApiUrl)
  }

  public async fetchEndpoint<T>(
    endpoint: string,
    options?: object
  ): Promise<T> {
    const trimmedEndpoint = trimUrl(endpoint)
    return fetchUrl<T>(`${this.relayApiUrl}/${trimmedEndpoint}`, options)
  }
}
