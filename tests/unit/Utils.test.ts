import BigNumber from 'bignumber.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import fetchMock = require('fetch-mock')
import 'mocha'

import utils, { DELEGATION_GAS_PRICE_DIVISOR } from '../../src/utils'

import {
  Amount,
  DelegationFeesInternal,
  ExchangeCancelEvent,
  ExchangeFillEvent
} from '../../src/typings'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('Utils', () => {
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

    describe('#fetchUrl()', () => {
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
      it('should only return base url', () => {
        const base = 'http://trustlines'
        assert.equal(utils.buildUrl(base), 'http://trustlines')
      })

      it('should return query url with encoded params for base http://test.com/api', () => {
        const base = 'http://test.com/api'
        const query = {
          key1: 'value1',
          key2: ' ',
          key3: '?'
        }
        const queryUrl = 'http://test.com/api?key1=value1&key2=%20&key3=%3F'
        assert.equal(utils.buildUrl(base, { query }), queryUrl)
      })

      it('should return query url with encoded params for base http://test.com/api/', () => {
        const base = 'http://test.com/api/'
        const query = {
          key1: 'value1',
          key2: ' ',
          key3: '?'
        }
        const queryUrl = 'http://test.com/api?key1=value1&key2=%20&key3=%3F'
        assert.equal(utils.buildUrl(base, { query }), queryUrl)
      })

      it('should return query url with encoded params for base trustlines://', () => {
        const base = 'trustlines://action'
        const query = {
          key1: 'value1',
          key2: ' ',
          key3: '?'
        }
        const queryUrl = 'trustlines://action?key1=value1&key2=%20&key3=%3F'
        assert.equal(utils.buildUrl(base, { query }), queryUrl)
      })

      it('should return url with encoded path for http://trustlines', () => {
        const base = 'http://trustlines'
        const path = ['contact', '0x00', 'username with spaces']
        const url = 'http://trustlines/contact/0x00/username%20with%20spaces'
        assert.equal(utils.buildUrl(base, { path }), url)
      })

      it('should return url with encoded path http://test.com/api', () => {
        const base = 'http://test.com/api'
        const path = ['contact', '0x00', 'username with spaces']
        const url = 'http://test.com/api/contact/0x00/username%20with%20spaces'
        assert.equal(utils.buildUrl(base, { path }), url)
      })

      it('should return url with encoded path http://test.com/api/', () => {
        const base = 'http://test.com/api/'
        const path = ['contact', '0x00', 'username with spaces']
        const url = 'http://test.com/api/contact/0x00/username%20with%20spaces'
        assert.equal(utils.buildUrl(base, { path }), url)
      })

      it('should return url with encoded path trustlines://', () => {
        const base = 'trustlines://'
        const path = ['contact', '0x00', 'username with spaces']
        const url = 'trustlines://contact/0x00/username%20with%20spaces'
        assert.equal(utils.buildUrl(base, { path }), url)
      })
    })

    describe('#calcRaw()', () => {
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

    describe('#calculateDelegationFeesAmount()', () => {
      it('should return non float raw value', () => {
        const baseFee = 123
        const gasPrice = 1
        const delegationFees: DelegationFeesInternal = {
          baseFee: utils.formatToAmountInternal(baseFee, DECIMALS),
          gasPrice: utils.formatToAmountInternal(gasPrice, DECIMALS),
          currencyNetworkOfFees: ''
        }
        const gasLimit = 123456
        const caclulatedFees = utils.calculateDelegationFeesAmount(
          delegationFees,
          gasLimit
        )

        const rawFees =
          baseFee + (gasPrice * gasLimit) / DELEGATION_GAS_PRICE_DIVISOR
        const flooredRawFees = Math.floor(rawFees)
        // We check that the rounding actually did something
        assert.notEqual(rawFees, flooredRawFees)
        const valueFees = utils.formatToAmount(flooredRawFees, DECIMALS).value

        assert.hasAllKeys(caclulatedFees, ['decimals', 'raw', 'value'])
        assert.equal(caclulatedFees.raw, flooredRawFees.toString())
        assert.equal(caclulatedFees.value, valueFees)
        assert.equal(caclulatedFees.decimals, DECIMALS)
      })
    })

    describe('#formatToAmountInternal()', () => {
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
      it('should format numerical values of event', () => {
        const event = {
          balance: 1000,
          interestRateGiven: 500,
          nonNumericAttr: 'hello'
        }
        const formattedEvent = utils.formatEvent<any>(event, 2, 3)
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
      it('should format numerical values of fill event', () => {
        const rawFillEvent = {
          filledMakerAmount: 100,
          filledTakerAmount: 200,
          type: 'LogFill'
        }

        const formattedFillEvent = utils.formatExchangeEvent(
          rawFillEvent as any,
          2,
          2
        )
        assert.hasAllKeys(formattedFillEvent, [
          'filledMakerAmount',
          'filledTakerAmount',
          'type'
        ])
        assert.hasAllKeys(
          (formattedFillEvent as ExchangeFillEvent).filledMakerAmount,
          ['decimals', 'raw', 'value']
        )
        assert.hasAllKeys(
          (formattedFillEvent as ExchangeFillEvent).filledTakerAmount,
          ['decimals', 'raw', 'value']
        )
      })

      it('should format numerical values of cancel event', () => {
        const rawFillEvent = {
          cancelledMakerAmount: 100,
          cancelledTakerAmount: 200,
          type: 'LogCancel'
        }

        const formattedFillEvent = utils.formatExchangeEvent(
          rawFillEvent as any,
          2,
          2
        )
        assert.hasAllKeys(formattedFillEvent, [
          'cancelledMakerAmount',
          'cancelledTakerAmount',
          'type'
        ])
        assert.hasAllKeys(
          (formattedFillEvent as ExchangeCancelEvent).cancelledMakerAmount,
          ['decimals', 'raw', 'value']
        )
        assert.hasAllKeys(
          (formattedFillEvent as ExchangeCancelEvent).cancelledTakerAmount,
          ['decimals', 'raw', 'value']
        )
      })

      it('should throw error', () => {
        const noExchangeEvent = { type: 'NoExchange' }
        assert.throw(() =>
          utils.formatExchangeEvent(noExchangeEvent as any, 2, 2)
        )
      })
    })

    describe('#convertEthToWei()', () => {
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
      it('should generate a random number', () => {
        const randomNumber = utils.generateRandomNumber(2)
        assert.instanceOf(randomNumber, BigNumber)
        assert.isAtMost(randomNumber.toNumber(), 99)
      })
    })
  })
})
