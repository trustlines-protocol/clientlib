import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import { config, wait } from '../Fixtures'

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
      ;[[network], user1, user2] = await Promise.all([
        tl1.currencyNetwork.getAll(),
        tl1.user.create(),
        tl2.user.create()
      ])
    })

    describe('#messageStream()', () => {
      const messages = []
      let stream

      before(async () => {
        stream = tl1.messaging
          .messageStream()
          .subscribe(message => messages.push(message))
        await wait()
      })

      it('should receive payment requests', async () => {
        await tl2.messaging.paymentRequest(
          network.address,
          user1.address,
          '250',
          'Hello'
        )
        await wait()
        expect(messages).to.have.lengthOf(2)
        expect(messages[1]).to.have.property('type', 'PaymentRequest')
        expect(messages[1].amount).to.have.keys('raw', 'value', 'decimals')
        expect(messages[1]).to.have.nested.property('amount.value', '250')
        expect(messages[1].timestamp).to.be.a('number')
        expect(messages[1]).to.have.property('from', user2.address)
        expect(messages[1]).to.have.property('to', user1.address)
        expect(messages[1]).to.have.property('counterParty', user2.address)
        expect(messages[1]).to.have.property('user', user1.address)
        expect(messages[1]).to.have.property('direction', 'received')
        expect(messages[1]).to.have.property('subject', 'Hello')
      })

      after(async () => {
        stream.unsubscribe()
        await wait()
      })
    })
  })
})
