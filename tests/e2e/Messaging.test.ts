import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import {
  createAndLoadUsers,
  parametrizedTLNetworkConfig,
  wait
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  parametrizedTLNetworkConfig.forEach(testParameter => {
    describe(`Messaging for wallet type: ${testParameter.walletType}`, () => {
      const { expect } = chai

      const config = testParameter.config
      const tl1 = new TLNetwork(config)
      const tl2 = new TLNetwork(config)
      let user1
      let user2
      let network

      before(async () => {
        ;[[network], [user1, user2]] = await Promise.all([
          tl1.currencyNetwork.getAll(),
          createAndLoadUsers([tl1, tl2])
        ])
      })

      describe('#paymentRequest()', () => {
        it('should return sent payment request', async () => {
          const sentPaymentRequest = await tl1.messaging.paymentRequest(
            network.address,
            tl2.user.address,
            10,
            'test subject'
          )
          expect(sentPaymentRequest.type).to.equal('PaymentRequest')
          expect(sentPaymentRequest.networkAddress).to.equal(network.address)
          expect(sentPaymentRequest.from).to.equal(tl1.user.address)
          expect(sentPaymentRequest.to).to.equal(tl2.user.address)
          expect(sentPaymentRequest.amount).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(sentPaymentRequest.amount.value).to.equal('10')
          expect(sentPaymentRequest.subject).to.equal('test subject')
          expect(sentPaymentRequest.nonce).to.be.a('number')
          expect(sentPaymentRequest.counterParty).to.equal(tl2.user.address)
          expect(sentPaymentRequest.direction).to.equal('sent')
          expect(sentPaymentRequest.user).to.equal(tl1.user.address)
        })
      })

      describe('#messageStream()', () => {
        const messages = []
        let stream

        before(async () => {
          stream = tl1.messaging
            .messageStream()
            .subscribe(message => messages.push(message))
          await wait()
          await tl2.messaging.paymentRequest(
            network.address,
            user1.address,
            '250',
            'Hello'
          )
          await wait()
        })

        it('should receive payment requests', async () => {
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
})
