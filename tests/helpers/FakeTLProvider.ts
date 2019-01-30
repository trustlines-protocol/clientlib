import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { TLProvider } from '../../src/providers/TLProvider'

import {
  FAKE_CLOSE_PATH_RAW,
  FAKE_NETWORK,
  FAKE_RELAY_API,
  FAKE_TRANSFER_EVENT,
  FAKE_TRUSTLINE,
  FAKE_TX_HASH,
  FAKE_TX_INFOS,
  FAKE_USER,
  FAKE_USER_ADDRESSES
} from '../Fixtures'

import { TxInfos } from '../../src/typings'

export class FakeTLProvider implements TLProvider {
  public relayApiUrl = FAKE_RELAY_API
  public relayWsApiUrl = FAKE_RELAY_API
  public errors: any = {}

  /**
   * Mocks utils.fetchUrl
   */
  public async fetchEndpoint<T>(
    endpoint: string,
    options?: object
  ): Promise<T> {
    const splitEndpoint = endpoint.split('/')
    let response

    if (this.errors.fetchUrl) {
      throw new Error('Mocked error in fetchUrl | Status 404')
    }

    switch (splitEndpoint[0]) {
      case 'relay':
        // mock response of `POST /relay`
        response = FAKE_TX_HASH
        break
      case 'request-ether':
        // mock response of `GET /request-ether`
        response = FAKE_TX_HASH
        break
      case 'blocknumber':
        // mock response of `GET /blocknumber`
        response = 123465
        break
      case 'users':
        if (splitEndpoint.length === 3) {
          if (splitEndpoint[2] === 'balance') {
            // mock response of `GET /users/:userAddress/balance`
            response = '100'
          } else if (splitEndpoint[2] === 'events') {
            // mock response of `GET /users/:userAddress/events`
            response = [FAKE_TRANSFER_EVENT]
          } else if (splitEndpoint[2] === 'txinfos') {
            // mock response of `GET /users/:userAddress/events`
            response = FAKE_TX_INFOS
          }
        }
        break
      case 'networks':
        if (splitEndpoint.length === 1) {
          // mock response of `GET /networks`
          response = [FAKE_NETWORK]
        } else if (splitEndpoint.length === 2) {
          // mock response of `GET /networks/:networkAddress`
          response = FAKE_NETWORK
        } else if (splitEndpoint.length === 3) {
          if (splitEndpoint[2] === 'users') {
            // mock response of `GET /networks/:networkAddress/users`
            response = FAKE_USER_ADDRESSES
          } else if (splitEndpoint[2] === 'close-trustline-path-info') {
            // mock response of `POST /networks/:networkAddress/close-trustline-path-info`
            response = FAKE_CLOSE_PATH_RAW
          }
        } else if (splitEndpoint.length === 4) {
          // mock response of `GET /networks/:networkAddress/users/:userAddress`
          response = FAKE_USER
        } else if (splitEndpoint.length === 5) {
          if (splitEndpoint[4] === 'events') {
            // mock response of `GET /networks/:networkAddress/users/:userAddress/events`
            response = [FAKE_TRANSFER_EVENT]
          } else if (splitEndpoint[4] === 'trustlines') {
            // mock response of `GET /networks/:networkAddress/users/:userAddress/trustlines`
            response = [FAKE_TRUSTLINE]
          }
        } else if (splitEndpoint.length === 6) {
          if (splitEndpoint[4] === 'trustlines') {
            // mock response of `GET /networks/:networkAddress/users/:userAddress/trustlines/:counterPartyAddress`
            response = FAKE_TRUSTLINE
          }
        }
      default:
        break
    }
    return Promise.resolve(response)
  }

  public createWebsocketStream(
    endpoint: string,
    functionName: string,
    args: object
  ) {
    throw new Error('Method not implemented.')
  }

  public async getTxInfos(userAddress: string): Promise<TxInfos> {
    if (this.errors.getTxInfos) {
      throw new Error('Mocked error in provider.getTxInfos()')
    }
    return Promise.resolve({
      balance: new BigNumber('1000000'),
      gasPrice: new BigNumber('2000000'),
      nonce: 15
    })
  }

  public async getBalance(
    addressOrName: string | Promise<string>,
    blockTag?: string | number | Promise<ethers.providers.BlockTag>
  ): Promise<ethers.utils.BigNumber> {
    if (this.errors.getBalance) {
      throw new Error('Mocked error in provider.getBalance()')
    }
    return Promise.resolve(ethers.utils.bigNumberify('1000000'))
  }

  public async getTransactionCount(
    addressOrName: string | Promise<string>,
    blockTag?: string | number | Promise<ethers.providers.BlockTag>
  ): Promise<number> {
    if (this.errors.getTransactionCount) {
      throw new Error('Mocked error in provider.getTransactionCount()')
    }
    return Promise.resolve(10)
  }

  public async getBlockNumber(): Promise<number> {
    if (this.errors.getBlockNumber) {
      throw new Error('Mocked error in provider.getBlockNumber()')
    }
    return Promise.resolve(1000)
  }

  public async getGasPrice(): Promise<ethers.utils.BigNumber> {
    if (this.errors.getGasPrice) {
      throw new Error('Mocked error in provider.getGasPrice()')
    }
    return Promise.resolve(ethers.utils.bigNumberify('1000000'))
  }

  public async sendTransaction(
    signedTransaction: string | Promise<string>
  ): Promise<ethers.providers.TransactionResponse> {
    if (this.errors.sendTransaction) {
      throw new Error('Mocked error in provider.sendTransaction()')
    }
    return Promise.resolve({
      chainId: undefined,
      confirmations: undefined,
      data: '0x',
      from: '0x',
      gasLimit: ethers.utils.bigNumberify('1000000'),
      gasPrice: ethers.utils.bigNumberify('1000000'),
      hash: '0x',
      nonce: 10,
      r: '0x',
      raw: '0x',
      s: '0x',
      to: '0x',
      v: 27,
      value: ethers.utils.bigNumberify('1000000'),
      wait: async () => {
        throw new Error('Method not implemented.')
      }
    })
  }

  public async getNetwork(): Promise<ethers.utils.Network> {
    throw new Error('Method not implemented.')
  }

  public async getCode(
    addressOrName: string | Promise<string>,
    blockTag?: string | number | Promise<ethers.providers.BlockTag>
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  public async getStorageAt(
    addressOrName: string | Promise<string>,
    position:
      | string
      | number
      | ethers.utils.BigNumber
      | ArrayLike<number>
      | Promise<ethers.utils.BigNumberish>,
    blockTag?: string | number
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  public async call(
    transaction: ethers.providers.TransactionRequest,
    blockTag?: string | number | Promise<ethers.providers.BlockTag>
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  public async estimateGas(
    transaction: ethers.providers.TransactionRequest
  ): Promise<ethers.utils.BigNumber> {
    throw new Error('Method not implemented.')
  }

  public async getBlock(
    blockHashOrBlockTag: string | number | Promise<ethers.providers.BlockTag>,
    includeTransactions?: boolean
  ): Promise<ethers.providers.Block> {
    throw new Error('Method not implemented.')
  }

  public async getTransaction(
    transactionHash: string
  ): Promise<ethers.providers.TransactionResponse> {
    throw new Error('Method not implemented.')
  }

  public async getTransactionReceipt(
    transactionHash: string
  ): Promise<ethers.providers.TransactionReceipt> {
    throw new Error('Method not implemented.')
  }

  public async getLogs(
    filter: ethers.providers.Filter
  ): Promise<ethers.providers.Log[]> {
    throw new Error('Method not implemented.')
  }

  public async resolveName(name: string | Promise<string>): Promise<string> {
    throw new Error('Method not implemented.')
  }

  public async lookupAddress(
    address: string | Promise<string>
  ): Promise<string> {
    throw new Error('Method not implemented.')
  }

  public on(
    eventName: ethers.providers.EventType,
    listener: ethers.providers.Listener
  ): ethers.providers.Provider {
    throw new Error('Method not implemented.')
  }

  public once(
    eventName: ethers.providers.EventType,
    listener: ethers.providers.Listener
  ): ethers.providers.Provider {
    throw new Error('Method not implemented.')
  }

  public listenerCount(eventName?: ethers.providers.EventType): number {
    throw new Error('Method not implemented.')
  }

  public listeners(
    eventName: ethers.providers.EventType
  ): ethers.providers.Listener[] {
    throw new Error('Method not implemented.')
  }

  public removeAllListeners(
    eventName: ethers.providers.EventType
  ): ethers.providers.Provider {
    throw new Error('Method not implemented.')
  }

  public removeListener(
    eventName: ethers.providers.EventType,
    listener: ethers.providers.Listener
  ): ethers.providers.Provider {
    throw new Error('Method not implemented.')
  }

  public async waitForTransaction(
    transactionHash: string,
    timeout?: number
  ): Promise<ethers.providers.TransactionReceipt> {
    throw new Error('Method not implemented.')
  }

  public setError(functionName) {
    this.errors[functionName] = true
  }

  public removeError(functionName) {
    this.errors[functionName] = false
  }
}
