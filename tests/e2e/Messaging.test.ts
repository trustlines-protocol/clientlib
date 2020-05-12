import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import utils from '../../src/utils'
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
          expect(sentPaymentRequest.id).to.be.a('string')
          expect(utils.convertToHexString(sentPaymentRequest.nonce)).to.equal(
            sentPaymentRequest.id
          )
          expect(sentPaymentRequest.counterParty).to.equal(tl2.user.address)
          expect(sentPaymentRequest.direction).to.equal('sent')
          expect(sentPaymentRequest.user).to.equal(tl1.user.address)
        })
      })

      describe('#paymentRequestDecline()', () => {
        it('should return sent decline', async () => {
          const declineMessage = await tl1.messaging.paymentRequestDecline(
            tl2.user.address,
            '0x10',
            'test subject'
          )
          expect(declineMessage.type).to.equal('PaymentRequestDecline')
          expect(declineMessage.nonce).to.equal(16)
          expect(declineMessage.id).to.equal('0x10')
          expect(declineMessage.subject).to.equal('test subject')
        })
      })

      describe('#sendUsernameToCounterparty()', () => {
        it('should return sent username message', async () => {
          const sentUsernameMessage = await tl1.messaging.sendUsernameToCounterparty(
            'User 1',
            tl2.user.address
          )
          expect(sentUsernameMessage).to.include({
            type: 'Username',
            from: tl1.user.address,
            to: tl2.user.address,
            username: 'User 1',
            direction: 'sent'
          })
        })
      })

      describe('#paymentMessage()', () => {
        it('should return sent payment message', async () => {
          const sentPaymentMessage = await tl1.messaging.paymentMessage(
            tl2.user.address,
            '0x10',
            'test message'
          )
          expect(sentPaymentMessage.type).to.equal('PaymentMessage')
          expect(sentPaymentMessage.transferId).to.equal('0x10')
          expect(sentPaymentMessage.subject).to.equal('test message')
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
          const paymentRequest = await tl2.messaging.paymentRequest(
            network.address,
            user1.address,
            '250',
            'Hello'
          )
          await wait()
          await tl1.messaging.paymentRequestDecline(
            user1.address,
            paymentRequest.id,
            'decline subject'
          )
          await wait()
          await tl2.messaging.sendUsernameToCounterparty(
            'John Doe',
            user1.address
          )
          await wait()
          await tl1.messaging.paymentMessage(
            user1.address,
            '0x1234',
            'payment message'
          )
          await wait()
        })

        it('should receive all messages', () => {
          expect(messages).to.have.lengthOf(5)
        })

        it('should receive payment requests', async () => {
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

        it('should receive payment requests decline', async () => {
          expect(messages[2]).to.have.property('type', 'PaymentRequestDecline')
          expect(messages[2].timestamp).to.be.a('number')
          expect(messages[2].nonce).to.be.a('number')
          expect(messages[2]).to.have.property('subject', 'decline subject')
        })

        it('should receive username', async () => {
          expect(messages[3]).to.include({
            type: 'Username',
            from: user2.address,
            to: user1.address,
            username: 'John Doe',
            direction: 'received'
          })
          expect(messages[3].timestamp).to.be.a('number')
        })

        it('should receive payment message', async () => {
          expect(messages[4]).to.have.property('type', 'PaymentMessage')
          expect(messages[4].timestamp).to.be.a('number')
          expect(messages[4].transferId).to.be.a('string')
          expect(messages[4]).to.have.property('subject', 'payment message')
        })

        after(async () => {
          stream.unsubscribe()
          await wait()
        })
      })
    })
  })
})
