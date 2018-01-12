import 'mocha'
import * as chai from 'chai'
import { TLNetwork } from '../../src/TLNetwork'
import { config } from '../Fixtures'

describe('unit', () => {
  describe.only('Utils', () => {
    const { expect } = chai
    const tl = new TLNetwork(config)

    describe('#calcRaw()', () => {
      it('should return raw value', () => {
        expect(tl.utils.calcRaw(1.23, 2)).to.equal(123)
      })
    })

    describe('#calcValue()', () => {
      it('should return value from raw', () => {
        expect(tl.utils.calcValue(100, 2)).to.equal(1)
      })
    })

    describe('formatAmount()', () => {
      const amount = tl.utils.formatAmount(123, 2)
      it('should return amount object', () => {
        expect(amount).to.have.keys('decimals', 'raw', 'value')
        expect(amount.decimals).to.equal(2)
        expect(amount.raw).to.equal(123)
        expect(amount.value).to.equal(1.23)
      })
    })

    // TODO
    // describe('#buildUrl()', () => {
    //   it('should build an url', () => {
    //   })
    // })
    //
    // TODO
    // describe('#createLink()', () => {
    //   it('should create a link', () => {
    //   })
    // })
  })
})
