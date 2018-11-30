import { Utils } from '../../src/Utils'

/**
 * Mock Utils class
 */
export class FakeUtils extends Utils {
  /**
   * Mocks utils.fetchUrl
   */
  public async fetchUrl<T>(endpoint: string, options?: object): Promise<T> {
    let response
    if (endpoint.includes('txinfos')) {
      // mock transaction infos returned by relay server
      response = {
        gasLimit: '2000000',
        gasPrice: '2000000',
        nonce: 12
      }
    } else if (endpoint.includes('relay')) {
      // mock transaction hash after relay
      response =
        '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b'
    } else if (endpoint.includes('blocknumber')) {
      response = 123456
    } else if (endpoint.includes('users') && endpoint.includes('balance')) {
      response = '123456'
    }
    return Promise.resolve(response)
  }
}
