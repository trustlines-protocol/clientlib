import 'mocha'
import * as chai from 'chai'
import BigNumber from 'bignumber.js'

import { TLNetwork } from '../../src/TLNetwork'
import { config } from '../Fixtures'

describe('unit', () => {
  describe('Utils', () => {
    const { expect } = chai
    const tl = new TLNetwork(config)

    describe('#calcRaw()', () => {
      it('should return raw value', () => {
        expect(tl.utils.calcRaw(1.23, 2)).to.equal('123')
      })
    })

    describe('#calcValue()', () => {
      it('should return value from raw', () => {
        expect(tl.utils.calcValue(100, 2)).to.equal('1')
      })
    })

    describe('#formatToAmount()', () => {
      const numValue = 123
      const strValue = numValue.toString()
      const bnValue = new BigNumber(numValue)
      const decimals = 2

      it('should format number to Amount object', () => {
        const amount = tl.utils.formatToAmount(numValue, decimals)
        expect(amount).to.have.keys('decimals', 'raw', 'value')
        expect(amount.decimals).to.equal(2)
        expect(amount.raw).to.equal('123')
        expect(amount.value).to.equal('1.23')
      })

      it('should format string to Amount object', () => {
        const amount = tl.utils.formatToAmount(strValue, decimals)
        expect(amount).to.have.keys('decimals', 'raw', 'value')
        expect(amount.decimals).to.equal(2)
        expect(amount.raw).to.equal('123')
        expect(amount.value).to.equal('1.23')
      })

      it('should format BigNumber to Amount object', () => {
        const amount = tl.utils.formatToAmount(bnValue, decimals)
        expect(amount).to.have.keys('decimals', 'raw', 'value')
        expect(amount.decimals).to.equal(2)
        expect(amount.raw).to.equal('123')
        expect(amount.value).to.equal('1.23')
      })
    })

    describe('#formatToAmountInternal()', () => {
      const numValue = 123
      const strValue = numValue.toString()
      const bnValue = new BigNumber(numValue)
      const decimals = 2

      it('should format number to AmountInternal object', () => {
        const amount = tl.utils.formatToAmountInternal(numValue, decimals)
        expect(amount).to.have.keys('decimals', 'raw', 'value')
        expect(amount.decimals).to.equal(2)
        expect(amount.raw).to.be.instanceof(BigNumber)
        expect(amount.raw.toString()).to.equal('123')
        expect(amount.value).to.be.instanceof(BigNumber)
        expect(amount.value.toString()).to.equal('1.23')
      })

      it('should format string to Amount object', () => {
        const amount = tl.utils.formatToAmountInternal(strValue, decimals)
        expect(amount).to.have.keys('decimals', 'raw', 'value')
        expect(amount.decimals).to.equal(2)
        expect(amount.raw).to.be.instanceof(BigNumber)
        expect(amount.raw.toString()).to.equal('123')
        expect(amount.value).to.be.instanceof(BigNumber)
        expect(amount.value.toString()).to.equal('1.23')
      })

      it('should format BigNumber to Amount object', () => {
        const amount = tl.utils.formatToAmountInternal(bnValue, decimals)
        expect(amount).to.have.keys('decimals', 'raw', 'value')
        expect(amount.decimals).to.equal(2)
        expect(amount.raw).to.be.instanceof(BigNumber)
        expect(amount.raw.toString()).to.equal('123')
        expect(amount.value).to.be.instanceof(BigNumber)
        expect(amount.value.toString()).to.equal('1.23')
      })
    })

    describe('#convertToAmount()', () => {
      const amountInternal = tl.utils.formatToAmountInternal(123, 2)

      it('should convert AmountInternal to Amount object', () => {
        const amount = tl.utils.convertToAmount(amountInternal)
        expect(amount).to.have.keys('decimals', 'raw', 'value')
        expect(amount.decimals).to.equal(2)
        expect(amount.raw).to.equal('123')
        expect(amount.value).to.equal('1.23')
      })
    })

    describe('#convertEthToWei()', () => {
      it('should return 1 eth in wei', () => {
        expect(tl.utils.convertEthToWei(1)).to.equal(1000000000000000000)
      })

      it('should return 0.123456789 eth in wei', () => {
        expect(tl.utils.convertEthToWei(0.123456789)).to.equal(123456789000000000)
      })

      it('should return 1 wei', () => {
        expect(tl.utils.convertEthToWei(0.000000000000000001)).to.equal(1)
      })
    })

    describe('#buildUrl()', () => {
      it('should return base url', () => {
        const base = 'http://trustlines.network/v1'
        expect(tl.utils.buildUrl(base)).to.equal('http://trustlines.network/v1')
      })

      it('should return query url with encoded params', () => {
        const base = '/path'
        const params = {
          key1: 'value1',
          key2: ' ',
          key3: '?'
        }
        const queryUrl = '/path?key1=value1&key2=%20&key3=%3F'
        expect(tl.utils.buildUrl(base, params)).to.equal(queryUrl)
      })

      it('should return url with encoded path', () => {
        const base = 'http://trustlines.network/v1'
        const url = 'http://trustlines.network/v1/contact/0x00/username%20with%20spaces'
        expect(tl.utils.buildUrl(base, ['contact', '0x00', 'username with spaces']))
          .to.equal(url)
      })
    })

    describe('#convertToHexString()', () => {
      const num = 123
      const numDecStr = '123'
      const numHexStr = '0x7b'

      it('should convert decimal string to hex', () => {
        const convertedHex = tl.utils.convertToHexString(numDecStr)
        expect(convertedHex).to.equal('0x7b')
      })

      it('should convert hex string to hex', () => {
        const convertedHex = tl.utils.convertToHexString(numHexStr)
        expect(convertedHex).to.equal(numHexStr)
      })

      it('should convert number to hex', () => {
        const convertedHex = tl.utils.convertToHexString(num)
        expect(convertedHex).to.equal('0x7b')
      })
    })
  })
})
