export interface TLProvider {
  relayApiUrl: string
  relayWsApiUrl: string
  fetchEndpoint<T>(endpoint: string, options?: object): Promise<T>
}
