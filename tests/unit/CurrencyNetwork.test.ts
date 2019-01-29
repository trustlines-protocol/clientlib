import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { CurrencyNetwork } from '../../src/CurrencyNetwork'
import { FakeUtils } from '../helpers/FakeUtils'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('CurrencyNetwork', () => {
    // test object
    let currencyNetwork

    // mocked classes
    let fakeUtils

    const initMocks = () => {
      fakeUtils = new FakeUtils()
      currencyNetwork = new CurrencyNetwork(
        'http://relay.network/api/v1',
        fakeUtils
      )
    }

    // constants
    const NETWORK_KEYS = [
      'name',
      'abbreviation',
      'address',
      'decimals',
      'numUsers',
      'defaultInterestRate',
      'interestRateDecimals',
      'customInterests'
    ]
    const AMOUNT_KEYS = ['decimals', 'raw', 'value']
    const USER_OVERVIEW_KEYS = [
      'balance',
      'given',
      'leftGiven',
      'leftReceived',
      'received'
    ]
    const VALID_ADDRESS = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
    const INVALID_ADDRESS = '0xinvalid'

    describe('#getAll()', () => {
      beforeEach(() => initMocks())

      it('should return mocked currency networks', async () => {
        const networks = await currencyNetwork.getAll()
        assert.isArray(networks)
        assert.hasAllKeys(networks[0], NETWORK_KEYS)
        assert.hasAllKeys(networks[0].defaultInterestRate, AMOUNT_KEYS)
      })

      it('should throw mocked error for fakeUtils.fetchUrl()', async () => {
        fakeUtils.setError('fetchUrl')
        await assert.isRejected(currencyNetwork.getAll())
      })
    })

    describe('#getInfo()', () => {
      beforeEach(() => initMocks())

      it('should return mocked currency network', async () => {
        const network = await currencyNetwork.getInfo(VALID_ADDRESS)
        assert.hasAllKeys(network, NETWORK_KEYS)
        assert.hasAllKeys(network.defaultInterestRate, AMOUNT_KEYS)
      })

      it('should throw error for invalid network address', async () => {
        await assert.isRejected(currencyNetwork.getInfo(INVALID_ADDRESS))
      })

      it('should throw mocked error for fakeUtils.fetchUrl()', async () => {
        fakeUtils.setError('fetchUrl')
        await assert.isRejected(currencyNetwork.getInfo(VALID_ADDRESS))
      })
    })

    describe('#getUsers()', () => {
      beforeEach(() => initMocks())

      it('should return mocked user addresses', async () => {
        const userAddresses = await currencyNetwork.getUsers(VALID_ADDRESS)
        assert.isArray(userAddresses)
      })

      it('should throw error for invalid network address', async () => {
        await assert.isRejected(currencyNetwork.getUsers(INVALID_ADDRESS))
      })

      it('should throw mocked error for fakeUtils.fetchUrl()', async () => {
        fakeUtils.setError('fetchUrl')
        await assert.isRejected(currencyNetwork.getUsers(VALID_ADDRESS))
      })
    })

    describe('#getUserOverview()', () => {
      beforeEach(() => initMocks())

      it('should return mocked user overview', async () => {
        const userOverview = await currencyNetwork.getUserOverview(
          VALID_ADDRESS,
          VALID_ADDRESS
        )
        assert.hasAllKeys(userOverview, USER_OVERVIEW_KEYS)
        assert.hasAllKeys(userOverview.balance, AMOUNT_KEYS)
        assert.hasAllKeys(userOverview.given, AMOUNT_KEYS)
        assert.hasAllKeys(userOverview.leftGiven, AMOUNT_KEYS)
        assert.hasAllKeys(userOverview.leftReceived, AMOUNT_KEYS)
        assert.hasAllKeys(userOverview.received, AMOUNT_KEYS)
      })

      it('should throw error for invalid network address', async () => {
        await assert.isRejected(
          currencyNetwork.getUserOverview(INVALID_ADDRESS, VALID_ADDRESS)
        )
      })

      it('should throw error for invalid user address', async () => {
        await assert.isRejected(
          currencyNetwork.getUserOverview(VALID_ADDRESS, INVALID_ADDRESS)
        )
      })

      it('should throw mocked error for fakeUtils.fetchUrl()', async () => {
        fakeUtils.setError('fetchUrl')
        await assert.isRejected(
          currencyNetwork.getUserOverview(VALID_ADDRESS, VALID_ADDRESS)
        )
      })
    })

    describe('#getDecimals()', () => {
      beforeEach(() => initMocks())

      it('should return network and interest rate decimals', async () => {
        const decimals = await currencyNetwork.getDecimals(VALID_ADDRESS)
        assert.hasAllKeys(decimals, ['networkDecimals', 'interestRateDecimals'])
        assert.isNumber(decimals.networkDecimals)
        assert.isNumber(decimals.interestRateDecimals)
      })

      it('should throw error for invalid network address', async () => {
        await assert.isRejected(currencyNetwork.getDecimals(INVALID_ADDRESS))
      })

      it('should return decimals if already known', async () => {
        const decimals = await currencyNetwork.getDecimals(VALID_ADDRESS, {
          interestRateDecimals: 6,
          networkDecimals: 5
        })
        assert.equal(decimals.interestRateDecimals, 6)
        assert.equal(decimals.networkDecimals, 5)
      })

      it('should throw error for fakeUtils.fetchUrl()', async () => {
        fakeUtils.setError('fetchUrl')
        await assert.isRejected(currencyNetwork.getDecimals(VALID_ADDRESS))
      })
    })

    describe('#isNetwork()', () => {
      beforeEach(() => initMocks())

      it('should return true', async () => {
        const isNetwork = await currencyNetwork.isNetwork(VALID_ADDRESS)
        assert.isTrue(isNetwork)
      })

      it('should return false', async () => {
        const isNetwork = await currencyNetwork.isNetwork(
          '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18'
        )
        assert.isFalse(isNetwork)
      })

      it('should throw error for invalid network address', async () => {
        await assert.isRejected(currencyNetwork.isNetwork(INVALID_ADDRESS))
      })

      it('should throw error for fakeUtils.fetchUrl()', async () => {
        fakeUtils.setError('fetchUrl')
        await assert.isRejected(currencyNetwork.isNetwork(VALID_ADDRESS))
      })
    })
  })
})
