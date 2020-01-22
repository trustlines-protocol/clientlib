import {
  Amount,
  MetaTransaction,
  MetaTransactionFees,
  ReconnectingWSOptions,
  TxInfos
} from '../typings'

/**
 * Interface for different provider strategies which extends the given
 * abstract class of `ethers.js`.
 */
export interface TLProvider {
  relayApiUrl: string
  relayWsApiUrl: string
  fetchEndpoint<T>(endpoint: string, options?: object): Promise<T>
  postToEndpoint<T>(endpoint: string, data: any): Promise<T>
  createWebsocketStream(
    endpoint: string,
    functionName: string,
    args: object,
    reconnectingOptions?: ReconnectingWSOptions
  ): any
  getTxInfos(userAddress: string): Promise<TxInfos>
  getMetaTxInfos(userAddress: string): Promise<TxInfos>
  getMetaTxFees(metaTransaction: MetaTransaction): Promise<MetaTransactionFees>
  getBalance(userAddress: string): Promise<Amount>
  getRelayVersion(): Promise<string>
  sendSignedTransaction(signedTransaction: string): Promise<string>
  sendSignedMetaTransaction(metaTransaction: MetaTransaction): Promise<string>
}
