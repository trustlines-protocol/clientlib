import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { CurrencyNetwork } from '../../src/CurrencyNetwork'
import { Event } from '../../src/Event'
import { User } from '../../src/User'
import { Utils } from '../../src/Utils'

import { FakeConfiguration } from '../helpers/FakeConfiguration'
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

    // Mocked classes
    let fakeUser
    let fakeUtils
    let fakeCurrencyNetwork
    let fakeTransaction
    let fakeTxSigner

    describe('#constructor()', () => {
      beforeEach(() => {
        fakeTxSigner = new FakeTxSigner()
        fakeUtils = new FakeUtils(new FakeConfiguration())
        fakeCurrencyNetwork = new FakeCurrencyNetwork(fakeUtils)
        fakeTransaction = new FakeTransaction(fakeUtils, fakeTxSigner)
        fakeUser = new FakeUser(new FakeTxSigner(), fakeTransaction, fakeUtils)
      })

      it('should construct an Event instance', () => {
        event = new Event(fakeUser, fakeUtils, fakeCurrencyNetwork)
        assert.instanceOf(event.user, User)
        assert.instanceOf(event.utils, Utils)
        assert.instanceOf(event.currencyNetwork, CurrencyNetwork)
      })
    })

    describe('#get()', () => {
      beforeEach(() => {
        fakeTxSigner = new FakeTxSigner()
        fakeUtils = new FakeUtils(new FakeConfiguration())
        fakeCurrencyNetwork = new FakeCurrencyNetwork(fakeUtils)
        fakeTransaction = new FakeTransaction(fakeUtils, fakeTxSigner)
        fakeUser = new FakeUser(new FakeTxSigner(), fakeTransaction, fakeUtils)
        event = new Event(fakeUser, fakeUtils, fakeCurrencyNetwork)
      })

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
      beforeEach(() => {
        fakeTxSigner = new FakeTxSigner()
        fakeUtils = new FakeUtils(new FakeConfiguration())
        fakeCurrencyNetwork = new FakeCurrencyNetwork(fakeUtils)
        fakeTransaction = new FakeTransaction(fakeUtils, fakeTxSigner)
        fakeUser = new FakeUser(new FakeTxSigner(), fakeTransaction, fakeUtils)
        event = new Event(fakeUser, fakeUtils, fakeCurrencyNetwork)
      })

      it('should return events as array', async () => {
        const events = await event.getAll({ fromBlock: 0 })
        assert.isArray(events)
      })
    })

    describe('#setDecimalsAndFormat()', () => {
      beforeEach(() => {
        fakeTxSigner = new FakeTxSigner()
        fakeUtils = new FakeUtils(new FakeConfiguration())
        fakeCurrencyNetwork = new FakeCurrencyNetwork(fakeUtils)
        fakeTransaction = new FakeTransaction(fakeUtils, fakeTxSigner)
        fakeUser = new FakeUser(new FakeTxSigner(), fakeTransaction, fakeUtils)
        event = new Event(fakeUser, fakeUtils, fakeCurrencyNetwork)
      })

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
