import { Utils } from '../../src/Utils'

import { Amount } from '../../src/typings'

import {
  FAKE_AMOUNT,
  FAKE_CLOSE_PATH_RAW,
  FAKE_FORMATTED_TRANSFER_EVENT,
  FAKE_NETWORK,
  FAKE_TRANSFER_EVENT,
  FAKE_TRUSTLINE,
  FAKE_TX_HASH,
  FAKE_TX_INFOS,
  FAKE_USER,
  FAKE_USER_ADDRESSES
} from '../Fixtures'

/**
 * Mock Utils class
 */
export class FakeUtils extends Utils {
  public errors: any = {}

  /**
   * Mocks utils.fetchUrl
   */
  public async fetchUrl<T>(endpoint: string, options?: object): Promise<T> {
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

  public formatToAmount(raw, decimals): Amount {
    return FAKE_AMOUNT
  }

  public createLink(params): string {
    return 'https://fake.link/path/query?param=param1'
  }

  public buildUrl(baseUrl, filter) {
    return baseUrl
  }

  public formatEvent(event, networkDecimals, interestRateDecimals) {
    return FAKE_FORMATTED_TRANSFER_EVENT as any
  }

  public convertToHexString(decimalStr) {
    return '0x'
  }

  public setError(functionName) {
    this.errors[functionName] = true
  }

  public removeError(functionName) {
    this.errors[functionName] = false
  }
}
