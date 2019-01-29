import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'
import { Observable } from 'rxjs/Observable'

import { TLProvider } from './TLProvider'

import utils from '../utils'

import { TxInfos, TxInfosRaw } from '../typings'

export class RelayProvider implements TLProvider {
  public relayApiUrl: string
  public relayWsApiUrl: string

  constructor(relayApiUrl: string, relayWsApiUrl: string) {
    this.relayApiUrl = relayApiUrl
    this.relayWsApiUrl = relayWsApiUrl
  }

  /////////////
  // Network //
  /////////////

  /**
   * Returns a `Promise` with a `ethers.Network` object describing the
   * connected network and chain of the relay.
   */
  public getNetwork(): Promise<ethers.utils.Network> {
    throw new Error('Method not implemented.')
  }

  /**
   * Returns a JSON response from the REST API of the relay server.
   * @param endpoint Endpoint to fetch.
   * @param options Optional fetch options.
   */
  public async fetchEndpoint<T>(
    endpoint: string,
    options?: object
  ): Promise<T> {
    const trimmedEndpoint = utils.trimUrl(endpoint)
    return utils.fetchUrl<T>(`${this.relayApiUrl}/${trimmedEndpoint}`, options)
  }

  /**
   * Creates a websocket stream connection to the relay server.
   * @param endpoint Websocket stream endpoint to connect to.
   * @param functionName Function to call on connection.
   * @param args Function arguments.
   */
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

  /////////////
  // Account //
  /////////////

  /**
   * Returns a `Promise` with the balance of given address at optionally given
   * block tag.
   * @param address Ethereum address.
   * @param blockTag Block number as number or hex string or `latest` or `pending`.
   */
  public async getBalance(
    address: string,
    blockTag?: string | number | Promise<ethers.providers.BlockTag>
  ): Promise<ethers.utils.BigNumber> {
    const { balance } = await this.fetchEndpoint<TxInfosRaw>(
      `users/${address}/txinfos`
    )
    return ethers.utils.bigNumberify(balance)
  }

  /**
   * Returns a `Promise` with the number of sent transactions from given
   * address at optionally given block tag.
   * @param address Ethereum address.
   * @param blockTag Block number as number or hex string or `latest` or `pending`.
   */
  public async getTransactionCount(
    address: string | Promise<string>,
    blockTag?: string | number | Promise<ethers.providers.BlockTag>
  ): Promise<number> {
    const { nonce } = await this.fetchEndpoint<TxInfosRaw>(
      `users/${address}/txinfos`
    )
    return nonce
  }

  /**
   * Returns needed information for creating an ethereum transaction.
   * @param address Address of user creating the transaction
   * @returns Information for creating an ethereum transaction for the given user address.
   *          See type `TxInfos` for more details.
   */
  public async getTxInfos(address: string): Promise<TxInfos> {
    const { nonce, gasPrice, balance } = await this.fetchEndpoint<TxInfosRaw>(
      `users/${address}/txinfos`
    )
    return {
      balance: new BigNumber(balance),
      gasPrice: new BigNumber(gasPrice),
      nonce
    }
  }

  ///////////////////////
  // Blockchain Status //
  ///////////////////////

  /**
   * Returns a `Promise` with the latest block number.
   */
  public async getBlockNumber(): Promise<number> {
    return this.fetchEndpoint<number>(`blocknumber`)
  }

  /**
   * Returns a `Promise` with the current gas price as a `BigNumber`.
   */
  public getGasPrice(): Promise<ethers.utils.BigNumber> {
    throw new Error('Method not implemented.')
  }

  /**
   * Returns a `Promise` with the block at given _blockHashOrBlockTag_.
   * @param blockHashOrBlockTag
   * @param includeTransactions
   */
  public getBlock(
    blockHashOrBlockTag: string | number | Promise<ethers.providers.BlockTag>,
    includeTransactions?: boolean
  ): Promise<ethers.providers.Block> {
    // TODO implement `GET /block`
    throw new Error('Method not implemented.')
  }

  /**
   * Returns a `Promise` with the transaction with the given _transactionsHash_.
   * @param transactionHash
   */
  public getTransaction(
    transactionHash: string
  ): Promise<ethers.providers.TransactionResponse> {
    // TODO implement `GET /transaction`
    throw new Error('Method not implemented.')
  }

  /**
   * Returns a `Promise` with the transaction receipt of the given _transactionHash_.
   * @param transactionHash
   */
  public getTransactionReceipt(
    transactionHash: string
  ): Promise<ethers.providers.TransactionReceipt> {
    // TODO implement `GET /transaction-receipt`
    throw new Error('Method not implemented.')
  }

  /////////
  // ENS //
  /////////

  public resolveName(name: string | Promise<string>): Promise<string> {
    throw new Error('Method not supported by relay server.')
  }

  public lookupAddress(address: string | Promise<string>): Promise<string> {
    throw new Error('Method not supported by relay server.')
  }

  ////////////////////////
  // Contract Execution //
  ////////////////////////

  /**
   * Send the given _signedTransaction_ to a relay server to execute it on the
   * blockchain and return a `Promise` with a `Transaction Request`.
   * @param signedTransaction
   */
  public sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<ethers.providers.TransactionResponse> {
    // TODO use existing `POST /relay`
    throw new Error('Method not implemented.')
  }

  /**
   * Send the given read-only transaction to a relay server and return a
   * `Promise` the result (as a hex string) of executing it.
   * @param transaction
   * @param blockTag
   */
  public call(
    transaction: ethers.providers.TransactionRequest,
    blockTag?: string | number | Promise<ethers.providers.BlockTag>
  ): Promise<string> {
    // TODO use existing `POST /relay`
    throw new Error('Method not implemented.')
  }

  /**
   * Send the given _transaction_ to a relay server and return a `Promise`
   * with the estimated amount of gas required to send it.
   * @param transaction
   */
  public estimateGas(
    transaction: ethers.providers.TransactionRequest
  ): Promise<ethers.utils.BigNumber> {
    // TODO implement `POST /estimate-gas`
    throw new Error('Method not implemented.')
  }

  ////////////////////
  // Contract State //
  ////////////////////

  /**
   * Returns a `Promise` with the bytecode (as a hex string) at given _address_.
   * @param address
   * @param blockTag
   */
  public getCode(
    address: string | Promise<string>,
    blockTag?: string | number | Promise<ethers.providers.BlockTag>
  ): Promise<string> {
    // TODO implement `GET /contract/:contractAddress`
    throw new Error('Method not implemented.')
  }

  /**
   * Returns a `Promise` with the value (as a hex string) at given _address_ in
   * _position_ at _blockTag_.
   * @param address
   * @param position
   * @param blockTag
   */
  public getStorageAt(
    address: string | Promise<string>,
    position:
      | string
      | number
      | ethers.utils.BigNumber
      | ArrayLike<number>
      | Promise<ethers.utils.BigNumberish>,
    blockTag?: string | number
  ): Promise<string> {
    // TODO implement `GET /contract/:contractAddress/storage`
    throw new Error('Method not implemented.')
  }

  /**
   * Returns a `Promise` with an array of the logs that match the _filter_.
   * @param filter
   */
  public getLogs(
    filter: ethers.providers.Filter
  ): Promise<ethers.providers.Log[]> {
    // TODO implement `GET /logs`
    throw new Error('Method not implemented.')
  }

  ////////////
  // Events //
  ////////////

  /**
   * Register a callback for any future _eventType_.
   * @param eventType
   * @param listener
   */
  public on(
    eventType: ethers.providers.EventType,
    listener: ethers.providers.Listener
  ): ethers.providers.Provider {
    throw new Error('Method not implemented.')
  }

  /**
   * Register a callback for the next (and only next) _eventType_.
   * @param eventType
   * @param listener
   */
  public once(
    eventType: ethers.providers.EventType,
    listener: ethers.providers.Listener
  ): ethers.providers.Provider {
    throw new Error('Method not implemented.')
  }

  /**
   * Return the number of callbacks registered for eventType, or if omitted,
   * the total number of callbacks registered
   * @param eventType
   */
  public listenerCount(eventType?: ethers.providers.EventType): number {
    throw new Error('Method not implemented.')
  }

  /**
   * Return registered callbacks for eventType.
   */
  public listeners(
    eventType: ethers.providers.EventType
  ): ethers.providers.Listener[] {
    throw new Error('Method not implemented.')
  }

  /**
   * Unregister all callbacks for eventType.
   * @param eventType
   */
  public removeAllListeners(
    eventType: ethers.providers.EventType
  ): ethers.providers.Provider {
    throw new Error('Method not implemented.')
  }

  /**
   * Unregister one callback for eventType. If the same callback is registered
   * more than once, only first registered instance is removed.
   * @param eventType
   * @param listener
   */
  public removeListener(
    eventType: ethers.providers.EventType,
    listener: ethers.providers.Listener
  ): ethers.providers.Provider {
    throw new Error('Method not implemented.')
  }

  //////////////////////////////
  // Waiting for Transactions //
  //////////////////////////////

  /**
   * Return a `Promise` which resolves to `TransactionReceipt` once the
   * transaction with the given _transactionHash_ is mined.
   * @param transactionHash
   * @param timeout
   */
  public waitForTransaction(
    transactionHash: string,
    timeout?: number
  ): Promise<ethers.providers.TransactionReceipt> {
    throw new Error('Method not implemented.')
  }
}
