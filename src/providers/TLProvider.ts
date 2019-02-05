export interface TLProvider {
  relayApiUrl: string
  relayWsApiUrl: string
  fetchEndpoint<T>(endpoint: string, options?: object): Promise<T>
  createWebsocketStream(
    endpoint: string,
    functionName: string,
    args: object
  ): any
}
