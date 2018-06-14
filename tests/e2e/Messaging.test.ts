import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2, wait } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Messaging', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let network

    before(async () => {
      [ [ network ], user1, user2 ] = await Promise.all([
        tl1.currencyNetwork.getAll(),
        tl1.user.load(keystore1),
        tl2.user.load(keystore2)
      ])
    })

    describe('#messageStream()', () => {
      let messages = []
      let stream

      before(async () => {
        stream = tl1.messaging.messageStream()
          .subscribe(message => messages.push(message))
        await wait(1000)
      })

      it('should receive payment requests', async () => {
        tl2.messaging.paymentRequest(network.address, user1.address, 250)
        await wait(1000)
        expect(messages).to.have.lengthOf(2)
        expect(messages[1]).to.have.property('type', 'PaymentRequest')
        expect(messages[1].amount).to.have.keys('raw', 'value', 'decimals')
        expect(messages[1]).to.have.nested.property('amount.value', '250')
        expect(messages[1].timestamp).to.be.a('number')
        expect(messages[1]).to.have.property('from', user2.address)
        expect(messages[1]).to.have.property('to', user1.address)
        expect(messages[1]).to.have.property('address', user2.address)
        expect(messages[1]).to.have.property('direction', 'received')
      })

      after(async () => {
        stream.unsubscribe()
        wait(1000)
      })
    })
  })
})
