import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { isFeePayerValue } from '../../src/typings'

chai.use(chaiAsPromised)

describe('Typing', () => {
  it('should return false for incorrect feePayer', () => {
    chai.expect(isFeePayerValue('test')).to.equal(false)
  })

  it('should return true for correct feePayer', () => {
    chai.expect(isFeePayerValue('sender')).to.equal(true)
  })
})
