import { expect } from 'chai'
import 'mocha'
import { decode, encode } from '../../src/extraData'

describe('unit', () => {
  describe('extraData', () => {
    it('should encode and decode correctly', () => {
      const extraData = { paymentRequestId: '0x1234567890abcdef' }
      expect(extraData).to.be.deep.eq(decode(encode(extraData)))
    })
  })
})
