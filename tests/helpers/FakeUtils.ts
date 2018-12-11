import { Utils } from '../../src/Utils'

import { Amount } from '../../src/typings'

import {
  FAKE_AMOUNT,
  FAKE_NETWORK,
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
    const splittedEndpoint = endpoint.split('/')
    let response

    if (this.errors.fetchUrl) {
      throw new Error('Mocked error in fetchUrl | Status 404')
    }

    if (endpoint.includes('txinfos')) {
      // mock transaction infos returned by relay server
      response = {
        gasLimit: '2000000',
        gasPrice: '2000000',
        nonce: 12
      }
    } else if (
      endpoint.includes('relay') ||
      endpoint.includes('request-ether')
    ) {
      // mock transaction hash after relay
      response =
        '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b'
    } else if (endpoint.includes('blocknumber')) {
      response = 123456
    } else if (endpoint.includes('users') && endpoint.includes('balance')) {
      response = '123456'
    } else if (endpoint.includes('networks')) {
      if (splittedEndpoint.length === 1) {
        // mock GET /networks response
        response = [FAKE_NETWORK]
      } else if (splittedEndpoint.length === 2) {
        // mock GET /networks/:networkAddress
        response = FAKE_NETWORK
      } else if (splittedEndpoint.length === 3) {
        // mock GET /networks/:networkAddress/users
        response = FAKE_USER_ADDRESSES
      } else if (splittedEndpoint.length === 4) {
        // mock GET /networks/:networkAddress/users/:userAddress
        response = FAKE_USER
      }
    }
    return Promise.resolve(response)
  }

  public formatToAmount(raw, decimals): Amount {
    return FAKE_AMOUNT
  }

  public createLink(params): string {
    return 'https://fake.link/path/query?param=param1'
  }

  public setError(functionName) {
    this.errors[functionName] = true
  }

  public removeError(functionName) {
    this.errors[functionName] = false
  }
}
