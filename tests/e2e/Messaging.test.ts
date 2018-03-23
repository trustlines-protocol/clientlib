import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2 } from '../Fixtures'
import { Promise } from 'es6-promise'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Messaging', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let networkAddress

    before(done => {
      tl1.currencyNetwork.getAll()
        .then(results => networkAddress = results[0].address)
        .then(() => Promise.all([tl1.user.load(keystore1), tl2.user.load(keystore2)]))
        .then(users => [ user1, user2 ] = users)
        .then(() => done())
    })

    describe('#messageStream()', () => {
      let messages = []
      let stream
      before((done) => {
        stream = tl1.messaging.messageStream().subscribe(message => messages.push(message))
        setTimeout(() => done(), 1000)
      })

      it('should receive payment requests', (done) => {
        tl2.messaging.paymentRequest(networkAddress, user1.address, 250)
        setTimeout(() => {
          expect(messages).to.have.lengthOf(2)
          expect(messages[1]).to.have.property('type', 'PaymentRequest')
          expect(messages[1].amount).to.have.keys('raw', 'value', 'decimals')
          expect(messages[1]).to.have.nested.property('amount.value', 250)
          expect(messages[1].timestamp).to.be.a('number')
          expect(messages[1]).to.have.property('from', user2.address)
          expect(messages[1]).to.have.property('to', user1.address)
          expect(messages[1]).to.have.property('address', user2.address)
          expect(messages[1]).to.have.property('direction', 'received')
          done()
        }, 1000)
      })

      after(() => {
        stream.unsubscribe()
      })
    })
  })
})
