import 'mocha'
import * as chai from 'chai'
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

    describe('#formatAmount()', () => {
      const amount = tl.utils.formatAmount(123, 2)
      it('should return amount object', () => {
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
  })
})
