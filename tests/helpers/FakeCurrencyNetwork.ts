import { CurrencyNetwork } from '../../src/CurrencyNetwork'

import { DecimalsObject, NetworkDetails } from '../../src/typings'

import { FAKE_DECIMALS, FAKE_NETWORK } from '../Fixtures'

/**
 * Mock Transaction class
 */
export class FakeCurrencyNetwork extends CurrencyNetwork {
  public errors: any = {}

  public async getDecimals(): Promise<DecimalsObject> {
    if (this.errors.getDecimals) {
      throw new Error('Mocked error in currencyNetwork.getDecimals()!')
    }
    return Promise.resolve(FAKE_DECIMALS)
  }

  public async getInfo(networkAddress): Promise<NetworkDetails> {
    if (this.errors.getInfo) {
      throw new Error('Mocked error in currencyNetwork.getInfo()!')
    }
    return Promise.resolve(FAKE_NETWORK as any)
  }

  public isNetwork(networkAddress) {
    const fakeNetworkAddresses = ['0xf8E191d2cd72Ff35CB8F012685A29B31996614EA']
    return Promise.resolve(fakeNetworkAddresses.indexOf(networkAddress) !== -1)
  }

  public setError(functionName) {
    this.errors[functionName] = true
  }
}
