import {
  Amount,
  MetaTransaction,
  MetaTransactionFees,
  MetaTransactionStatus,
  ReconnectingWSOptions,
  TransactionStatusObject,
  TxInfos
} from '../typings'

/**
 * Interface for different provider strategies which extends the given
 * abstract class of `ethers.js`.
 */
export interface TLProvider {
  ApiUrl: string
  WsApiUrl: string
  fetchEndpoint<T>(endpoint: string, options?: object): Promise<T>
  postToEndpoint<T>(endpoint: string, data: any): Promise<T>
  createWebsocketStream(
    endpoint: string,
    functionName: string,
    args: object,
    reconnectingOptions?: ReconnectingWSOptions
  ): any
  getTxInfos(userAddress: string): Promise<TxInfos>
  getTxStatus(txHash: string): Promise<TransactionStatusObject>
  getIdentityNonce(userAddress: string): Promise<number>
  getIdentityImplementationAddress(userAddress: string): Promise<string>
  getMetaTxFees(metaTransaction: MetaTransaction): Promise<MetaTransactionFees>
  getMetaTxStatus(
    identityAddress: string,
    metaTransactionHash: string
  ): Promise<MetaTransactionStatus>
  getBalance(userAddress: string): Promise<Amount>
  sendSignedTransaction(signedTransaction: string): Promise<string>
  sendSignedMetaTransaction(metaTransaction: MetaTransaction): Promise<string>
}
