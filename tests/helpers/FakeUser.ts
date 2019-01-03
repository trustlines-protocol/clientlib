import { User } from '../../src/User'

import { DecimalsObject } from '../../src/typings'

import { FAKE_DECIMALS } from '../Fixtures'

/**
 * Mock Transaction class
 */
export class FakeUser extends User {
  public errors = {
    getDecimals: false
  }

  public async getDecimals(): Promise<DecimalsObject> {
    if (this.errors.getDecimals) {
      throw new Error('Mocked error in currencyNetwork.getDecimals()!')
    }
    return Promise.resolve(FAKE_DECIMALS)
  }

  public setError(functionName) {
    this.errors[functionName] = true
  }
}
