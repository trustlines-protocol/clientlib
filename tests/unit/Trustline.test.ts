import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { Trustline } from '../../src/Trustline'

import { FakeCurrencyNetwork } from '../helpers/FakeCurrencyNetwork'
import { FakeEvent } from '../helpers/FakeEvent'
import { FakeTLProvider } from '../helpers/FakeTLProvider'
import { FakeTLSigner } from '../helpers/FakeTLSigner'
import { FakeTLWallet } from '../helpers/FakeTLWallet'
import { FakeTransaction } from '../helpers/FakeTransaction'
import { FakeUser } from '../helpers/FakeUser'

import { FAKE_NETWORK, TL_WALLET_DATA } from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('Trustline', () => {
    // Test object
    let trustline: Trustline

    // Mocked classes
    let fakeUser
    let fakeCurrencyNetwork
    let fakeTLProvider
    let fakeTLSigner
    let fakeTransaction
    let fakeTLWallet
    let fakeEvent

    const init = () => {
      fakeTLProvider = new FakeTLProvider()
      fakeTLWallet = new FakeTLWallet()
      fakeTLSigner = new FakeTLSigner()
      fakeCurrencyNetwork = new FakeCurrencyNetwork(fakeTLProvider)
      fakeTransaction = new FakeTransaction({
        provider: fakeTLProvider,
        signer: fakeTLWallet,
        currencyNetwork: fakeCurrencyNetwork
      })
      fakeUser = new FakeUser({
        provider: fakeTLProvider,
        signer: fakeTLSigner,
        wallet: fakeTLWallet
      })
      fakeEvent = new FakeEvent({
        currencyNetwork: fakeCurrencyNetwork,
        provider: fakeTLProvider,
        user: fakeUser
      })
      trustline = new Trustline({
        currencyNetwork: fakeCurrencyNetwork,
        event: fakeEvent,
        provider: fakeTLProvider,
        transaction: fakeTransaction,
        user: fakeUser
      })
    }

    describe('#prepareUpdate()', () => {
      beforeEach(() => init())

      it('should return a transaction object w/o options', async () => {
        const tx = await trustline.prepareUpdate(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200
        )
        assert.hasAllKeys(tx, ['rawTx', 'txFees'])
      })

      it('should return a transaction object with specified interests', async () => {
        const tx = await trustline.prepareUpdate(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200,
          {
            interestRateGiven: 0.01,
            interestRateReceived: 0.02,
            isFrozen: false
          }
        )
        assert.hasAllKeys(tx, ['rawTx', 'txFees'])
      })

      it('should return a transaction object with specified interests, with default isFrozen value', async () => {
        const tx = await trustline.prepareUpdate(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200,
          {
            interestRateGiven: 0.01,
            interestRateReceived: 0.02
          }
        )
        assert.hasAllKeys(tx, ['rawTx', 'txFees'])
      })
    })

    describe('#prepareAccept()', () => {
      beforeEach(() => init())

      it('should return a transaction object w/o options', async () => {
        const tx = await trustline.prepareAccept(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200
        )
        assert.hasAllKeys(tx, ['rawTx', 'txFees'])
      })

      it('should return a transaction object with specified interests', async () => {
        const tx = await trustline.prepareAccept(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200,
          {
            interestRateGiven: 0.01,
            interestRateReceived: 0.02,
            isFrozen: false
          }
        )
        assert.hasAllKeys(tx, ['rawTx', 'txFees'])
      })
    })

    describe('#prepareCancelTrustlineUpdate()', () => {
      beforeEach(() => init())

      it('should return a transaction object', async () => {
        const tx = await trustline.prepareCancelTrustlineUpdate(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18'
        )
        assert.hasAllKeys(tx, ['rawTx', 'txFees'])
      })
    })

    describe('#confirm()', () => {
      beforeEach(() => init())

      it('should confirm a prepared transaction', async () => {
        const { rawTx } = await trustline.prepareUpdate(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200
        )
        const txHash = await trustline.confirm(rawTx)
        assert.isString(txHash)
      })
    })

    describe('#getAll()', () => {
      beforeEach(() => init())

      it('should return mocked formatted trustlines', async () => {
        const trustlines = await trustline.getAll(FAKE_NETWORK.address)
        assert.isArray(trustlines)
        assert.hasAllKeys(trustlines[0].given, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(trustlines[0].received, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(trustlines[0].leftGiven, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(trustlines[0].leftReceived, [
          'decimals',
          'value',
          'raw'
        ])
        assert.hasAllKeys(trustlines[0].interestRateGiven, [
          'decimals',
          'value',
          'raw'
        ])
        assert.hasAllKeys(trustlines[0].interestRateReceived, [
          'decimals',
          'value',
          'raw'
        ])
        assert.isBoolean(trustlines[0].isFrozen)
      })
    })

    describe('#get()', () => {
      beforeEach(() => init())

      it('should return mocked formatted trustlines', async () => {
        const tl = await trustline.get(
          FAKE_NETWORK.address,
          TL_WALLET_DATA.address
        )
        assert.hasAllKeys(tl.given, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.received, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.leftGiven, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.leftReceived, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.interestRateGiven, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.interestRateReceived, ['decimals', 'value', 'raw'])
        assert.isBoolean(tl.isFrozen)
      })
    })

    describe('#getRequests()', () => {
      beforeEach(() => init())

      it('should return mocked TrustlineUpdateRequest events', async () => {
        const [updateRequestEvent] = await trustline.getRequests(
          FAKE_NETWORK.address
        )
        assert.equal(updateRequestEvent.type, 'TrustlineUpdateRequest')
      })
    })

    describe('#getTrustlineUpdateCancels()', () => {
      beforeEach(() => init())

      it('should return mocked TrustlineUpdateCancel events', async () => {
        const [updateRequestEvent] = await trustline.getTrustlineUpdateCancels(
          FAKE_NETWORK.address
        )
        assert.equal(updateRequestEvent.type, 'TrustlineUpdateCancel')
      })
    })

    describe('#getUpdates()', () => {
      beforeEach(() => init())

      it('should return mocked TrustlineUpdate events', async () => {
        const [updateEvent] = await trustline.getUpdates(FAKE_NETWORK.address)
        assert.equal(updateEvent.type, 'TrustlineUpdate')
      })
    })

    describe('#getClosePath()', () => {
      beforeEach(() => init())

      it('should return mocked close path', async () => {
        const closePath = await trustline.getClosePath(
          FAKE_NETWORK.address,
          TL_WALLET_DATA.address,
          TL_WALLET_DATA.address
        )
        assert.hasAllKeys(closePath, ['maxFees', 'path', 'value', 'feePayer'])
      })
    })

    describe('#prepareClose()', () => {
      beforeEach(() => init())

      it('should return mocked close path', async () => {
        const closeTx = await trustline.prepareClose(
          FAKE_NETWORK.address,
          TL_WALLET_DATA.address
        )
        assert.hasAllKeys(closeTx, ['txFees', 'maxFees', 'path', 'rawTx'])
      })
    })
  })
})
