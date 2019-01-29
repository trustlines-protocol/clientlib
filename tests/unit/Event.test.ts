import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { CurrencyNetwork } from '../../src/CurrencyNetwork'
import { Event } from '../../src/Event'
import { User } from '../../src/User'
import { Utils } from '../../src/Utils'

import { FakeCurrencyNetwork } from '../helpers/FakeCurrencyNetwork'
import { FakeTransaction } from '../helpers/FakeTransaction'
import { FakeTxSigner } from '../helpers/FakeTxSigner'
import { FakeUser } from '../helpers/FakeUser'
import { FakeUtils } from '../helpers/FakeUtils'

import {
  FAKE_CANCEL_EVENT,
  FAKE_FILL_EVENT,
  FAKE_NETWORK,
  FAKE_TOKEN_EVENT,
  FAKE_TRANSFER_EVENT
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('Event', () => {
    // Test object
    let event

    const initMocks = () => {
      const fakeUtils = new FakeUtils()
      const relayApiUrl = 'http://relay.network/api/v1'
      const relayWsApiUrl = 'http://relay.network/api/v1'

      const fakeCurrencyNetwork = new FakeCurrencyNetwork(
        relayApiUrl,
        fakeUtils
      )
      const fakeTxSigner = new FakeTxSigner()
      const fakeTransaction = new FakeTransaction(
        fakeUtils,
        fakeTxSigner,
        relayApiUrl
      )
      const fakeUser = new FakeUser(
        fakeTxSigner,
        fakeTransaction,
        fakeUtils,
        relayApiUrl
      )
      event = new Event(
        fakeUser,
        fakeUtils,
        fakeCurrencyNetwork,
        relayApiUrl,
        relayWsApiUrl
      )
    }

    describe('#get()', () => {
      beforeEach(() => initMocks())

      it('should return mocked events as array', async () => {
        const events = await event.get(FAKE_NETWORK.address, { fromBlock: 0 })
        assert.isArray(events)
      })

      it('should return mocked formated events', async () => {
        const [formattedEvent] = await event.get(FAKE_NETWORK.address, {
          fromBlock: 0
        })
        assert.hasAllKeys(formattedEvent.amount, ['value', 'raw', 'decimals'])
      })
    })

    describe('#getAll()', () => {
      beforeEach(() => initMocks())

      it('should return events as array', async () => {
        const events = await event.getAll({ fromBlock: 0 })
        assert.isArray(events)
      })
    })

    describe('#setDecimalsAndFormat()', () => {
      beforeEach(() => initMocks())

      it('should return formatted events as array', async () => {
        const rawEvents = [
          FAKE_TRANSFER_EVENT,
          FAKE_TOKEN_EVENT,
          FAKE_FILL_EVENT,
          FAKE_CANCEL_EVENT
        ]
        const formattedEvents = await event.setDecimalsAndFormat(rawEvents)
        assert.isArray(formattedEvents)
      })
    })
  })
})
