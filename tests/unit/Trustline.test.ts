import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { CurrencyNetwork } from '../../src/CurrencyNetwork'
import { Event } from '../../src/Event'
import { Transaction } from '../../src/Transaction'
import { Trustline } from '../../src/Trustline'
import { User } from '../../src/User'
import { Utils } from '../../src/Utils'

import { FakeCurrencyNetwork } from '../helpers/FakeCurrencyNetwork'
import { FakeEvent } from '../helpers/FakeEvent'
import { FakeTransaction } from '../helpers/FakeTransaction'
import { FakeTxSigner } from '../helpers/FakeTxSigner'
import { FakeUser } from '../helpers/FakeUser'
import { FakeUtils } from '../helpers/FakeUtils'

import { FAKE_ACCOUNT, FAKE_NETWORK, FAKE_RELAY_API } from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('Trustline', () => {
    // Test object
    let trustline

    // Mocked classes
    let fakeUser
    let fakeUtils
    let fakeCurrencyNetwork
    let fakeTransaction
    let fakeTxSigner
    let fakeEvent

    // initialize test object with mocked classes
    const initialize = () => {
      fakeTxSigner = new FakeTxSigner()
      fakeUtils = new FakeUtils()
      fakeCurrencyNetwork = new FakeCurrencyNetwork(FAKE_RELAY_API, fakeUtils)
      fakeTransaction = new FakeTransaction(
        fakeUtils,
        fakeTxSigner,
        FAKE_RELAY_API
      )
      fakeUser = new FakeUser(
        new FakeTxSigner(),
        fakeTransaction,
        fakeUtils,
        FAKE_RELAY_API
      )
      fakeEvent = new FakeEvent(
        fakeUser,
        fakeUtils,
        fakeCurrencyNetwork,
        FAKE_RELAY_API,
        FAKE_RELAY_API
      )
      trustline = new Trustline(
        fakeEvent,
        fakeUser,
        fakeUtils,
        fakeTransaction,
        fakeCurrencyNetwork,
        FAKE_RELAY_API
      )
    }

    describe('#constructor()', () => {
      beforeEach(() => initialize())

      it('should construct a Trustline instance', () => {
        trustline = new Trustline(
          fakeEvent,
          fakeUser,
          fakeUtils,
          fakeTransaction,
          fakeCurrencyNetwork,
          FAKE_RELAY_API
        )
        assert.instanceOf(trustline.event, Event)
        assert.instanceOf(trustline.user, User)
        assert.instanceOf(trustline.utils, Utils)
        assert.instanceOf(trustline.transaction, Transaction)
        assert.instanceOf(trustline.currencyNetwork, CurrencyNetwork)
      })
    })

    describe('#prepareUpdate()', () => {
      beforeEach(() => initialize())

      it('should return a transaction object w/o options', async () => {
        const tx = await trustline.prepareUpdate(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200
        )
        assert.hasAllKeys(tx, ['rawTx', 'ethFees'])
      })

      it('should return a transaction object with specified interests', async () => {
        const tx = await trustline.prepareUpdate(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200,
          {
            interestRateGiven: '0.01',
            interestRateReceived: '0.02'
          }
        )
        assert.hasAllKeys(tx, ['rawTx', 'ethFees'])
      })
    })

    describe('#prepareAccept()', () => {
      beforeEach(() => initialize())

      it('should return a transaction object w/o options', async () => {
        const tx = await trustline.prepareAccept(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200
        )
        assert.hasAllKeys(tx, ['rawTx', 'ethFees'])
      })

      it('should return a transaction object w/o options', async () => {
        const tx = await trustline.prepareAccept(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200
        )
        assert.hasAllKeys(tx, ['rawTx', 'ethFees'])
      })
    })

    describe('#confirm()', () => {
      beforeEach(() => initialize())

      it('should confirm a prepared transaction', async () => {
        const { rawTx } = await trustline.prepareUpdate(
          FAKE_NETWORK.address,
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
          100,
          200
        )
        const txId = await trustline.confirm(rawTx)
        assert.isString(txId)
      })
    })

    describe('#getAll()', () => {
      beforeEach(() => initialize())

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
      })
    })

    describe('#get()', () => {
      beforeEach(() => initialize())

      it('should return mocked formatted trustlines', async () => {
        const tl = await trustline.get(
          FAKE_NETWORK.address,
          FAKE_ACCOUNT.address
        )
        assert.hasAllKeys(tl.given, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.received, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.leftGiven, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.leftReceived, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.interestRateGiven, ['decimals', 'value', 'raw'])
        assert.hasAllKeys(tl.interestRateReceived, ['decimals', 'value', 'raw'])
      })
    })

    describe('#getRequests()', () => {
      beforeEach(() => initialize())

      it('should return mocked TrustlineUpdateRequest events', async () => {
        const [updateRequestEvent] = await trustline.getRequests(
          FAKE_NETWORK.address
        )
        assert.equal(updateRequestEvent.type, 'TrustlineUpdateRequest')
      })
    })

    describe('#getUpdates()', () => {
      beforeEach(() => initialize())

      it('should return mocked TrustlineUpdate events', async () => {
        const [updateEvent] = await trustline.getUpdates(FAKE_NETWORK.address)
        assert.equal(updateEvent.type, 'TrustlineUpdate')
      })
    })

    describe('#getClosePath()', () => {
      beforeEach(() => initialize())

      it('should return mocked close path', async () => {
        const closePath = await trustline.getClosePath(
          FAKE_NETWORK.address,
          FAKE_ACCOUNT.address,
          FAKE_ACCOUNT.address
        )
        assert.hasAllKeys(closePath, [
          'estimatedGas',
          'maxFees',
          'path',
          'value'
        ])
      })
    })

    describe('#prepareClose()', () => {
      beforeEach(() => initialize())

      it('should return mocked close path', async () => {
        const closeTx = await trustline.prepareClose(
          FAKE_NETWORK.address,
          FAKE_ACCOUNT.address
        )
        assert.hasAllKeys(closeTx, ['ethFees', 'maxFees', 'path', 'rawTx'])
      })
    })
  })
})
