import { BigNumber } from 'bignumber.js'

import { TLProvider } from '../../src/providers/TLProvider'

import {
  FAKE_CLOSE_PATH_RAW,
  FAKE_IDENTITY,
  FAKE_NETWORK,
  FAKE_RELAY_API,
  FAKE_TRANSFER_EVENT,
  FAKE_TRUSTLINE,
  FAKE_TX_HASH,
  FAKE_TX_INFOS,
  FAKE_USER,
  FAKE_USER_ADDRESSES
} from '../Fixtures'

import { Amount, TxInfos } from '../../src/typings'

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
      case 'identities':
        response = FAKE_IDENTITY
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

  public async PostToEndpoint<T>(endpoint: string, data: any): Promise<T> {
    const options = {
      body: JSON.stringify(data),
      headers: new Headers({ 'Content-Type': 'application/json' }),
      method: 'POST'
    }
    return this.fetchEndpoint<T>(endpoint, options)
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

  public async getBalance(userAddress: string): Promise<Amount> {
    if (this.errors.getBalance) {
      throw new Error('Mocked error in provider.getBalance()')
    }
    return Promise.resolve({
      decimals: 18,
      raw: '1000000000000000000',
      value: '1'
    })
  }

  public async sendSignedTransaction(
    signedTransaction: string
  ): Promise<string> {
    if (this.errors.sendSignedTransaction) {
      throw new Error('Mocked error in provider.sendSignedTransaction()')
    }
    return Promise.resolve(FAKE_TX_HASH)
  }

  public setError(functionName) {
    this.errors[functionName] = true
  }

  public removeError(functionName) {
    this.errors[functionName] = false
  }
}
