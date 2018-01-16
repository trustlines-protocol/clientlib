import 'mocha'
import * as chai from 'chai'
import { TLNetwork } from '../../src/TLNetwork'
import { config, user1 } from '../Fixtures'

describe('integration', () => {
  describe('Utils', () => {
    const { expect } = chai
    const tl = new TLNetwork(config)

    describe('#checkAddress()', () => {
      const { address } = user1
      const lowerCaseAddress = address.toLowerCase()
      it('should return true for lower case', () => {
        expect(tl.utils.checkAddress(lowerCaseAddress)).to.equal(true)
      })

      it('should return false for lower case', () => {
        expect(tl.utils.checkAddress('0xabcdefgh')).to.equal(false)
      })

      it('should return true for checksum', () => {
        expect(tl.utils.checkAddress(address)).to.equal(true)
      })

      it('should return false for checksum', () => {
        expect(tl.utils.checkAddress('0xABCDEFGH')).to.equal(false)
      })
    })
  })
})
