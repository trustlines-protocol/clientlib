import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../src/TLNetwork'
import { config, keystore1, keystore2 } from './Fixtures'

declare let Promise: any

describe('Trustline', () => {
  chai.use(chaiAsPromised)

  const { expect } = chai
  const { currencyNetwork } = new TLNetwork(config)
  const tl1 = new TLNetwork(config)
  const tl2 = new TLNetwork(config)
  let user1
  let user2
  let networkAddress
  let tx

  before(done => {
    tl1.currencyNetwork.getAll()
      .then(results => networkAddress = results[0].address)
      .then(() => Promise.all([tl1.user.load(keystore1), tl2.user.load(keystore2)]))
      .then(users => [ user1, user2 ] = users)
      .then(() => tl1.user.requestEth())
      .then(() => tl2.user.requestEth())
      .then(() => done())
  })

  describe('request', () => {
    beforeEach(done => {
      tl1.trustline.prepareUpdate(networkAddress, user2.address, 1300)
        .then(updateTx => {
          tx = updateTx
          done()
        })
    })

    it('should prepare', () => {
      expect(tx.rawTx).to.be.a('string')
      expect(tx.ethFee).to.be.a('number')
      expect(tx.gasPrice).to.be.a('number')
    })

    it('should confirm and return latest request', done => {
      tl1.trustline.confirm(tx.rawTx).then(txId => {
        setTimeout(() => {
          tl1.trustline.getRequests(networkAddress).then(requests => {
            const latestRequest = requests[requests.length - 1]
            expect(latestRequest.address.toLowerCase()).to.equal(user2.address.toLowerCase())
            expect(latestRequest.amount).to.equal(1300)
            expect(latestRequest.blockNumber).to.be.a('number')
            expect(latestRequest.direction).to.equal('sent')
            expect(latestRequest.networkAddress.toLowerCase()).to.equal(networkAddress.toLowerCase())
            expect(latestRequest.status).to.be.a('string')
            expect(latestRequest.timestamp).to.be.a('number')
            expect(latestRequest.transactionId).to.equal(txId)
            expect(latestRequest.type).to.equal('CreditlineUpdateRequest')
            done()
          })
        }, 500)
      })
    })

    it('should return all requests', () => {
      expect(tl1.trustline.getRequests(networkAddress)).to.eventually.be.an('array')
    })
  })

  describe('accept', () => {
    before(done => {
      tl1.trustline.prepareUpdate(networkAddress, user2.address, 1250)
        .then(updateTx => tl1.trustline.confirm(updateTx.rawTx))
        .then(txId => setTimeout(() => done(), 500)) // FIXME ensure tx is included in block
    })

    beforeEach(done => {
      tl2.trustline.prepareAccept(networkAddress, user1.address, 1250)
        .then(updateTx => {
          tx = updateTx
          done()
        })
    })

    it('should prepare', () => {
      expect(tx.rawTx).to.be.a('string')
      expect(tx.ethFee).to.be.a('number')
      expect(tx.gasPrice).to.be.a('number')
    })

    it('should confirm and return latest update', done => {
      tl2.trustline.confirm(tx.rawTx).then(txId => {
        setTimeout(() => {
          tl2.trustline.getUpdates(networkAddress).then(updates => {
            const latestUpdate = updates[updates.length - 1]
            expect(latestUpdate.address.toLowerCase()).to.equal(user1.address.toLowerCase())
            expect(latestUpdate.amount).to.equal(1250)
            expect(latestUpdate.blockNumber).to.be.a('number')
            expect(latestUpdate.direction).to.equal('received')
            expect(latestUpdate.networkAddress.toLowerCase()).to.equal(networkAddress.toLowerCase())
            expect(latestUpdate.status).to.be.a('string')
            expect(latestUpdate.timestamp).to.be.a('number')
            expect(latestUpdate.transactionId).to.equal(txId)
            expect(latestUpdate.type).to.equal('CreditlineUpdate')
            done()
          })
        }, 500)
      })
    })

    it('should return all creditline updates', () => {
      expect(tl1.trustline.getUpdates(networkAddress)).to.eventually.be.an('array')
    })
  })

  describe('trustline', () => {
    it('should return trustline', () => {
      expect(tl1.trustline.get(networkAddress, user2.address))
        .to.eventually.have.keys('address', 'balance', 'given', 'id', 'leftGiven', 'leftReceived', 'received')
    })

    it('should return all trustlines', () => {
      expect(tl1.trustline.getAll(networkAddress)).to.eventually.be.an('array')
    })
  })
})
