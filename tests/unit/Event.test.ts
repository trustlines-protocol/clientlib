import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { Event } from '../../src/Event'

import { FakeCurrencyNetwork } from '../helpers/FakeCurrencyNetwork'
import { FakeTLProvider } from '../helpers/FakeTLProvider'
import { FakeTLSigner } from '../helpers/FakeTLSigner'
import { FakeTLWallet } from '../helpers/FakeTLWallet'
import { FakeTransaction } from '../helpers/FakeTransaction'
import { FakeUser } from '../helpers/FakeUser'

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

    const init = () => {
      const fakeTLProvider = new FakeTLProvider()
      const fakeCurrencyNetwork = new FakeCurrencyNetwork(fakeTLProvider)
      const fakeTLSigner = new FakeTLSigner()
      const fakeTLWallet = new FakeTLWallet()
      const fakeTransaction = new FakeTransaction({
        provider: fakeTLProvider,
        signer: fakeTLSigner
      })
      const fakeUser = new FakeUser({
        provider: fakeTLProvider,
        signer: fakeTLSigner,
        transaction: fakeTransaction,
        wallet: fakeTLWallet
      })
      event = new Event({
        currencyNetwork: fakeCurrencyNetwork,
        provider: fakeTLProvider,
        user: fakeUser
      })
    }

    describe('#get()', () => {
      beforeEach(() => init())

      it('should return mocked events as array', async () => {
        const events = await event.get(FAKE_NETWORK.address, {
          fromBlock: 0
        })
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
      beforeEach(() => init())

      it('should return events as array', async () => {
        const events = await event.getAll({ fromBlock: 0 })
        assert.isArray(events)
      })
    })

    describe('#setDecimalsAndFormat()', () => {
      beforeEach(() => init())

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
