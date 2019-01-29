import { ethers } from 'ethers'

import { TxInfos } from '../typings'

/**
 * Interface for different provider strategies which extends the given
 * abstract class of `ethers.js`.
 */
export interface TLProvider extends ethers.providers.Provider {
  relayApiUrl: string
  relayWsApiUrl: string
  fetchEndpoint<T>(endpoint: string, options?: object): Promise<T>
  createWebsocketStream(
    endpoint: string,
    functionName: string,
    args: object
  ): any
  getTxInfos(userAddress: string): Promise<TxInfos>
}
