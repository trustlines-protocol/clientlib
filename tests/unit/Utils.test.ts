import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import fetchMock = require('fetch-mock')
import 'mocha'

import { Utils } from '../../src/Utils'
import { FakeConfiguration } from '../helpers/FakeConfiguration'

describe('unit', () => {
  describe('Utils', () => {
    // mocks
    let fakeConfiguration

    // constants for number related tests
    const VALUE_NUM_INPUT = 1.23
    const VALUE_STR_INPUT = VALUE_NUM_INPUT.toString()
    const VALUE_BN_INPUT = new BigNumber(VALUE_NUM_INPUT)
    const RAW_NUM_INPUT = 123
    const RAW_STR_INPUT = RAW_NUM_INPUT.toString()
    const RAW_BN_INPUT = new BigNumber(RAW_NUM_INPUT)
    const DECIMALS = 2
    const RAW_OUTPUT = '123'
    const VALUE_OUTPUT = '1.23'

    // test object
    let utils

    describe('#fetchUrl()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })
      afterEach(() => fetchMock.reset())

      it('should return 200 json response', async () => {
        const fakeResponse = { hello: 'world' }

        // mock OK response
        fetchMock.get('*', fakeResponse)

        const jsonResponse = await utils.fetchUrl('fake/endpoint')
        assert.deepEqual(jsonResponse, fakeResponse)
      })

      it('should return 200 json response for endpoint with slash', async () => {
        const fakeResponse = { hello: 'world' }

        // mock OK response
        fetchMock.get('*', fakeResponse)

        const jsonResponse = await utils.fetchUrl('/fake/endpoint')
        assert.deepEqual(jsonResponse, fakeResponse)
      })

      it('should throw error', async () => {
        // mock ERROR response
        fetchMock.get('*', 400)

        await assert.isRejected(utils.fetchUrl('fake/endpoint'))
      })
    })

    describe('#buildUrl()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should only return base url', () => {
        const base = 'http://trustlines.network/v1'
        assert.equal(utils.buildUrl(base), 'http://trustlines.network/v1')
      })

      it('should return query url with encoded params', () => {
        const base = '/path'
        const params = {
          key1: 'value1',
          key2: ' ',
          key3: '?'
        }
        const queryUrl = '/path?key1=value1&key2=%20&key3=%3F'
        assert.equal(utils.buildUrl(base, params), queryUrl)
      })

      it('should return url with encoded path', () => {
        const base = 'http://trustlines.network/v1'
        const params = ['contact', '0x00', 'username with spaces']
        const url =
          'http://trustlines.network/v1/contact/0x00/username%20with%20spaces'
        assert.equal(utils.buildUrl(base, params), url)
      })
    })

    describe('#createLink()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should return url in trustlines link schema', () => {
        const params = ['contact', '0x']
        const url = 'http://trustlines.network/v1/contact/0x'
        assert.equal(utils.createLink(params), url)
      })
    })

    describe('#calcRaw()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should return raw value for number', () => {
        const raw = utils.calcRaw(VALUE_NUM_INPUT, DECIMALS)
        assert.instanceOf(raw, BigNumber)
        assert.equal(raw.toString(), RAW_OUTPUT)
      })

      it('should return raw value for string', () => {
        const raw = utils.calcRaw(VALUE_STR_INPUT, DECIMALS)
        assert.instanceOf(raw, BigNumber)
        assert.equal(raw.toString(), RAW_OUTPUT)
      })

      it('should return raw value for BigNumber', () => {
        const raw = utils.calcRaw(VALUE_BN_INPUT, DECIMALS)
        assert.instanceOf(raw, BigNumber)
        assert.equal(raw.toString(), RAW_OUTPUT)
      })
    })

    describe('#calcValue()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should return value for number', () => {
        const value = utils.calcValue(RAW_NUM_INPUT, DECIMALS)
        assert.instanceOf(value, BigNumber)
        assert.equal(value.toString(), VALUE_OUTPUT)
      })

      it('should return value for string', () => {
        const value = utils.calcValue(RAW_STR_INPUT, DECIMALS)
        assert.instanceOf(value, BigNumber)
        assert.equal(value.toString(), VALUE_OUTPUT)
      })

      it('should return value for BigNumber', () => {
        const value = utils.calcValue(RAW_BN_INPUT, DECIMALS)
        assert.instanceOf(value, BigNumber)
        assert.equal(value.toString(), VALUE_OUTPUT)
      })
    })

    describe('#formatToAmountInternal()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should format number to AmountInternal object', () => {
        const amount = utils.formatToAmountInternal(RAW_NUM_INPUT, DECIMALS)
        assert.hasAllKeys(amount, ['decimals', 'raw', 'value'])
        assert.equal(amount.decimals, DECIMALS)
        assert.instanceOf(amount.raw, BigNumber)
        assert.equal(amount.raw.toString(), RAW_OUTPUT)
        assert.instanceOf(amount.value, BigNumber)
        assert.equal(amount.value.toString(), VALUE_OUTPUT)
      })

      it('should format string to Amount object', () => {
        const amount = utils.formatToAmountInternal(RAW_STR_INPUT, DECIMALS)
        assert.hasAllKeys(amount, ['decimals', 'raw', 'value'])
        assert.equal(amount.decimals, DECIMALS)
        assert.instanceOf(amount.raw, BigNumber)
        assert.equal(amount.raw.toString(), RAW_OUTPUT)
        assert.instanceOf(amount.value, BigNumber)
        assert.equal(amount.value.toString(), VALUE_OUTPUT)
      })

      it('should format BigNumber to Amount object', () => {
        const amount = utils.formatToAmountInternal(RAW_BN_INPUT, DECIMALS)
        assert.hasAllKeys(amount, ['decimals', 'raw', 'value'])
        assert.equal(amount.decimals, DECIMALS)
        assert.instanceOf(amount.raw, BigNumber)
        assert.equal(amount.raw.toString(), RAW_OUTPUT)
        assert.instanceOf(amount.value, BigNumber)
        assert.equal(amount.value.toString(), VALUE_OUTPUT)
      })
    })

    describe('#formatToAmount()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should format number to Amount object', () => {
        const amount = utils.formatToAmount(RAW_NUM_INPUT, DECIMALS)
        assert.hasAllKeys(amount, ['decimals', 'raw', 'value'])
        assert.equal(amount.decimals, DECIMALS)
        assert.equal(amount.raw, RAW_OUTPUT)
        assert.equal(amount.value, VALUE_OUTPUT)
      })

      it('should format string to Amount object', () => {
        const amount = utils.formatToAmount(RAW_STR_INPUT, DECIMALS)
        assert.hasAllKeys(amount, ['decimals', 'raw', 'value'])
        assert.equal(amount.decimals, DECIMALS)
        assert.equal(amount.raw, RAW_OUTPUT)
        assert.equal(amount.value, VALUE_OUTPUT)
      })

      it('should format BigNumber to Amount object', () => {
        const amount = utils.formatToAmount(RAW_BN_INPUT, DECIMALS)
        assert.hasAllKeys(amount, ['decimals', 'raw', 'value'])
        assert.equal(amount.decimals, DECIMALS)
        assert.equal(amount.raw, RAW_OUTPUT)
        assert.equal(amount.value, VALUE_OUTPUT)
      })
    })

    describe('#convertToAmount()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should convert AmountInternal to Amount object', () => {
        const amountInternal = utils.formatToAmountInternal(
          RAW_NUM_INPUT,
          DECIMALS
        )
        const amount = utils.convertToAmount(amountInternal)
        assert.hasAllKeys(amount, ['decimals', 'raw', 'value'])
        assert.equal(amount.decimals, DECIMALS)
        assert.equal(amount.raw, RAW_OUTPUT)
        assert.equal(amount.value, VALUE_OUTPUT)
      })
    })

    describe('#formatEvent()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should format numerical values of event', () => {
        const event = {
          balance: 1000,
          interestRateGiven: 500,
          nonNumericAttr: 'hello'
        }
        const formattedEvent = utils.formatEvent(event, 2, 3)
        assert.hasAllKeys(formattedEvent, [
          'balance',
          'interestRateGiven',
          'nonNumericAttr'
        ])
        assert.equal(formattedEvent.balance.decimals, 2)
        assert.equal(formattedEvent.balance.raw, '1000')
        assert.equal(formattedEvent.balance.value, '10')
        assert.equal(formattedEvent.interestRateGiven.decimals, 3)
        assert.equal(formattedEvent.interestRateGiven.raw, '500')
        assert.equal(formattedEvent.interestRateGiven.value, '0.5')
        assert.equal(formattedEvent.nonNumericAttr, 'hello')
      })
    })

    describe('#formatExchangeEvent()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should format numerical values of fill event', () => {
        const rawFillEvent = {
          filledMakerAmount: 100,
          filledTakerAmount: 200,
          type: 'LogFill'
        }

        const formattedFillEvent = utils.formatExchangeEvent(rawFillEvent)
        assert.hasAllKeys(formattedFillEvent, [
          'filledMakerAmount',
          'filledTakerAmount',
          'type'
        ])
        assert.hasAllKeys(formattedFillEvent.filledMakerAmount, [
          'decimals',
          'raw',
          'value'
        ])
        assert.hasAllKeys(formattedFillEvent.filledTakerAmount, [
          'decimals',
          'raw',
          'value'
        ])
      })

      it('should format numerical values of cancel event', () => {
        const rawFillEvent = {
          cancelledMakerAmount: 100,
          cancelledTakerAmount: 200,
          type: 'LogCancel'
        }

        const formattedFillEvent = utils.formatExchangeEvent(rawFillEvent)
        assert.hasAllKeys(formattedFillEvent, [
          'cancelledMakerAmount',
          'cancelledTakerAmount',
          'type'
        ])
        assert.hasAllKeys(formattedFillEvent.cancelledMakerAmount, [
          'decimals',
          'raw',
          'value'
        ])
        assert.hasAllKeys(formattedFillEvent.cancelledTakerAmount, [
          'decimals',
          'raw',
          'value'
        ])
      })

      it('should throw error', () => {
        const noExchangeEvent = { type: 'NoExchange' }
        assert.throw(() => utils.formatExchangeEvent(noExchangeEvent))
      })
    })

    describe('#convertEthToWei()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should return 1 eth in wei', () => {
        assert.equal(utils.convertEthToWei(1), 1000000000000000000)
      })

      it('should return 0.123456789 eth in wei', () => {
        assert.equal(utils.convertEthToWei(0.123456789), 123456789000000000)
      })

      it('should return 1 wei', () => {
        assert.equal(utils.convertEthToWei(0.000000000000000001), 1)
      })
    })

    describe('#convertToHexString()', () => {
      const NUM = 123
      const NUM_HEX_STR = '0x7b'

      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should convert decimal string to hex', () => {
        assert.equal(utils.convertToHexString(NUM.toString()), NUM_HEX_STR)
      })

      it('should convert hex string to hex', () => {
        assert.equal(utils.convertToHexString(NUM_HEX_STR), NUM_HEX_STR)
      })

      it('should convert number to hex', () => {
        assert.equal(utils.convertToHexString(NUM), NUM_HEX_STR)
      })

      it('should throw on float', () => {
        assert.throw(() => utils.convertToHexString(1.23))
      })
    })

    describe('#checkAddress()', () => {
      const address = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
      const lowerCaseAddress = address.toLowerCase()

      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should return true for lower case', () => {
        assert.ok(utils.checkAddress(lowerCaseAddress))
      })

      it('should return false for lower case', () => {
        assert.notOk(utils.checkAddress('0xabcdefgh'))
      })

      it('should return true for checksum', () => {
        assert.ok(utils.checkAddress(address))
      })

      it('should return false for checksum', () => {
        assert.notOk(utils.checkAddress('0xABCDEFGH'))
      })
    })

    describe('#generateRandomNumber()', () => {
      beforeEach(() => {
        fakeConfiguration = new FakeConfiguration()
        utils = new Utils(fakeConfiguration)
      })

      it('should generate a random number', () => {
        const randomNumber = utils.generateRandomNumber(2)
        assert.instanceOf(randomNumber, BigNumber)
        assert.isAtMost(randomNumber.toNumber(), 99)
        assert.isAtLeast(randomNumber.toNumber(), 10)
      })
    })
  })
})
