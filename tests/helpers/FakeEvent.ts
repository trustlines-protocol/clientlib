import { Event } from '../../src/Event'

import { DecimalsObject } from '../../src/typings'

import {
  FAKE_TRUSTLINE_UPDATE_EVENT,
  FAKE_TRUSTLINE_UPDATE_REQUEST_EVENT
} from '../Fixtures'

/**
 * Mock Transaction class
 */
export class FakeEvent extends Event {
  public errors: any = {}

  public async get(networkAddress, filter: any = {}): Promise<any[]> {
    if (this.errors.get) {
      throw new Error('Mocked error in event.get()')
    }
    switch (filter.type) {
      case 'TrustlineUpdateRequest':
        return [FAKE_TRUSTLINE_UPDATE_REQUEST_EVENT]
      case 'TrustlineUpdate':
        return [FAKE_TRUSTLINE_UPDATE_EVENT]
      default:
        return []
    }
  }

  public setError(functionName) {
    this.errors[functionName] = true
  }
}
