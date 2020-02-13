import { Observable } from 'rxjs/Observable'

import utils from '../utils'

import { ReconnectingWSOptions } from '../typings'

export class Provider {
  public ApiUrl: string
  public WsApiUrl: string

  constructor(ApiUrl: string, WsApiUrl: string) {
    this.ApiUrl = ApiUrl
    this.WsApiUrl = WsApiUrl
  }

  /**
   * Returns a JSON response from the REST API of the server.
   * @param endpoint Endpoint to fetch.
   * @param options Optional fetch options.
   */
  public async fetchEndpoint<T>(
    endpoint: string,
    options?: object
  ): Promise<T> {
    const trimmedEndpoint = utils.trimUrl(endpoint)
    return utils.fetchUrl<T>(`${this.ApiUrl}/${trimmedEndpoint}`, options)
  }

  public async postToEndpoint<T>(endpoint: string, data: any): Promise<T> {
    const options = {
      body: JSON.stringify(data),
      headers: new Headers({ 'Content-Type': 'application/json' }),
      method: 'POST'
    }
    return this.fetchEndpoint<T>(endpoint, options)
  }

  /**
   * Creates a websocket stream connection to the server.
   * @param endpoint Websocket stream endpoint to connect to.
   * @param functionName Function to call on connection.
   * @param args Function arguments.
   * @param reconnectOnError Optional flag whether to try reconnecting web socket.
   */
  public createWebsocketStream(
    endpoint: string,
    functionName: string,
    args: object,
    reconnectingOptions?: ReconnectingWSOptions
  ): Observable<any> {
    const trimmedEndpoint = utils.trimUrl(endpoint)
    return utils.websocketStream(
      `${this.WsApiUrl}/${trimmedEndpoint}`,
      functionName,
      args,
      reconnectingOptions
    )
  }

  /**
   * Returns the version of the currently configured provider server.
   * @returns Version of relay in the format `<name>/vX.X.X`.
   */
  public async getVersion(): Promise<string> {
    return this.fetchEndpoint<string>(`version`)
  }
}
