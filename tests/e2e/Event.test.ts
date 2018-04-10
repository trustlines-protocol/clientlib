import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2 } from '../Fixtures'
import { Promise } from 'es6-promise'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Events', () => {
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
        .then(() => Promise.all([tl1.user.requestEth(), tl2.user.requestEth()]))
        .then(() => tl1.trustline.prepareUpdate(networkAddress, user2.address, 1000, 500))
        .then(({ rawTx }) => tl1.trustline.confirm(rawTx))
        .then(() => tl2.trustline.prepareUpdate(networkAddress, user1.address, 500, 1000))
        .then(({ rawTx }) => tl2.trustline.confirm(rawTx))
        .then(() => setTimeout(() => done(), 1000))
    })

    describe('#get()', () => {

      it('should return transfer updates', (done) => {
        tl1.payment.prepare(networkAddress, user2.address, 1.5)
          .then(({rawTx}) => tl1.payment.confirm(rawTx))
          .then(() => tl1.event.get(networkAddress))
          .then((events) => {
            const last = events[events.length - 1]
            expect(last.type).to.equal('Transfer')
            expect(last.direction).to.equal('sent')
            expect(last.from).to.equal(user1.address)
            expect(last.to).to.equal(user2.address)
            expect(last.blockNumber).to.be.a('number')
            expect(last.timestamp).to.be.a('number')
            expect(last.address).to.equal(user2.address)
            expect(last.networkAddress).to.equal(networkAddress)
            expect(last.status).to.be.a('string')
            expect(last.amount).to.have.keys('raw', 'value', 'decimals')
            done()
          })
      })
    })

    describe('#updateStreamTransfer()', () => {
      let events = []
      let stream
      before(done => {
        stream = tl1.event.updateStream().subscribe(event => events.push(event))
        tl1.payment.prepare(networkAddress, user2.address, 2.5)
          .then(({ rawTx }) => tl1.payment.confirm(rawTx))
          .then(() => setTimeout(() => done(), 1000))
      })

      it('should receive transfer updates', () => {
        expect(events).to.have.lengthOf(4)

        expect(events.filter((event) => event.type === 'WebsocketOpen')).to.have.lengthOf(1)
        expect(events.filter((event) => event.type === 'Transfer')).to.have.lengthOf(1)
        expect(events.filter((event) => event.type === 'BalanceUpdate')).to.have.lengthOf(1)
        expect(events.filter((event) => event.type === 'NetworkBalance')).to.have.lengthOf(1)

        let transferEvent = events.filter((event) => event.type === 'Transfer')[0]
        expect(transferEvent.amount).to.have.keys('raw', 'value', 'decimals')
        expect(transferEvent).to.have.nested.property('amount.value', 2.5)
        expect(transferEvent).to.have.property('direction', 'sent')
        expect(transferEvent).to.have.property('from', user1.address)
        expect(transferEvent).to.have.property('to', user2.address)
        expect(transferEvent).to.have.property('address', user2.address)

        let networkBalanceEvent = events.filter((event) => event.type === 'NetworkBalance')[0]
        expect(networkBalanceEvent.timestamp).to.be.a('number')
        expect(networkBalanceEvent.given).to.have.keys('raw', 'value', 'decimals')
        expect(networkBalanceEvent.received).to.have.keys('raw', 'value', 'decimals')
        expect(networkBalanceEvent.leftGiven).to.have.keys('raw', 'value', 'decimals')
        expect(networkBalanceEvent.leftReceived).to.have.keys('raw', 'value', 'decimals')

        let balanceEvent = events.filter((event) => event.type === 'BalanceUpdate')[0]
        expect(balanceEvent.timestamp).to.be.a('number')
        expect(balanceEvent.from).to.be.a('string')
        expect(balanceEvent.to).to.be.a('string')
        expect(balanceEvent.given).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.received).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.leftGiven).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.leftReceived).to.have.keys('raw', 'value', 'decimals')
      })

      after(() => {
        stream.unsubscribe()
      })

    })

    describe('#updateStreamTrustlineRequest()', () => {
      let events = []
      let stream

      before(done => {
        stream = tl2.event.updateStream().subscribe(event => events.push(event))
        new Promise(resolve => setTimeout(() => resolve(), 1000))
          .then(() => tl2.trustline.prepareUpdate(networkAddress, user1.address, 4001, 4002))
          .then(({ rawTx }) => tl2.trustline.confirm(rawTx))
          .then(() => setTimeout(() => done(), 1000))
      })

      it('should receive trustline update request', () => {
        expect(events).to.have.lengthOf(2)

        expect(events.filter((event) => event.type === 'WebsocketOpen')).to.have.lengthOf(1)
        expect(events.filter((event) => event.type === 'TrustlineUpdateRequest')).to.have.lengthOf(1)

        let trustlineRequestEvent = events.filter((event) => event.type === 'TrustlineUpdateRequest')[0]
        expect(trustlineRequestEvent.timestamp).to.be.a('number')
        expect(trustlineRequestEvent.from).to.equal(user2.address)
        expect(trustlineRequestEvent.to).to.equal(user1.address)
        expect(trustlineRequestEvent.address).to.equal(user1.address)
        expect(trustlineRequestEvent.direction).to.equal('sent')
        expect(trustlineRequestEvent.given).to.have.keys('raw', 'value', 'decimals')
        expect(trustlineRequestEvent.received).to.have.keys('raw', 'value', 'decimals')
        expect(trustlineRequestEvent).to.have.nested.property('given.value', 4001)
        expect(trustlineRequestEvent).to.have.nested.property('received.value', 4002)
      })

      after(() => {
        stream.unsubscribe()
      })

    })
  })
})
