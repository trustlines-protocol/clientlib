import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config } from '../Fixtures'

chai.use(chaiAsPromised)

describe('unit', () => {
  describe('CurrencyNetwork', () => {
    const { expect } = chai
    const { currencyNetwork } = new TLNetwork(config)

    describe('#getInfo()', () => {
      it('should reject invalid address', async () => {
        await expect(currencyNetwork.getInfo('0x123')).to.be.rejectedWith(
          '0x123 is not a valid address.'
        )
      })
    })

    describe('#getUsers()', () => {
      it('should reject invalid address', async () => {
        await expect(currencyNetwork.getUsers('0x123')).to.be.rejectedWith(
          '0x123 is not a valid address.'
        )
      })
    })
  })
})
