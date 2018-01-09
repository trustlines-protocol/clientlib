import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2 } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Trustline', () => {
    const { expect } = chai
    const { currencyNetwork } = new TLNetwork(config)
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let networkAddress
    let tx
    let txId

    before(done => {
      tl1.currencyNetwork.getAll()
        .then(results => networkAddress = results[0].address)
        .then(() => Promise.all([tl1.user.load(keystore1), tl2.user.load(keystore2)]))
        .then(users => [ user1, user2 ] = users)
        .then(() => Promise.all([tl1.user.requestEth(), tl2.user.requestEth()]))
        .then(() => done())
    })

    describe('#prepareUpdate()', () => {
      it('should prepare request tx', () => {
        expect(tl1.trustline.prepareUpdate(networkAddress, user2.address, 1300))
          .to.eventually.have.keys('rawTx', 'ethFee', 'gasPrice')
      })
    })

    describe('#confirm() request tx', () => {
      before(done => {
        tl1.trustline.prepareUpdate(networkAddress, user2.address, 1300)
          .then(updateTx => {
            tx = updateTx
            setTimeout(() => done(), 500)
          })
      })

      it('should return txId', done => {
        expect(tl1.trustline.confirm(tx.rawTx)).to.eventually.be.a('string')
        setTimeout(() => done(), 500)
      })
    })

    describe('#getRequests()', () => {
      before(done => {
        tl1.trustline.prepareUpdate(networkAddress, user2.address, 1500)
          .then(({ rawTx }) => tl1.trustline.confirm(rawTx))
          .then(id => {
            txId = id
            setTimeout(() => done(), 500)
          })
      })

      it('should return latest request', done => {
        tl1.trustline.getRequests(networkAddress).then(requests => {
          const latestRequest = requests[requests.length - 1]
          expect(latestRequest.address).to.equal(user2.address)
          expect(latestRequest.amount).to.equal(1500)
          expect(latestRequest.blockNumber).to.be.a('number')
          expect(latestRequest.direction).to.equal('sent')
          expect(latestRequest.networkAddress).to.equal(networkAddress)
          expect(latestRequest.status).to.be.a('string')
          expect(latestRequest.timestamp).to.be.a('number')
          expect(latestRequest.transactionId).to.equal(txId)
          expect(latestRequest.type).to.equal('CreditlineUpdateRequest')
          done()
        })
      })

      it('should return all requests', () => {
        expect(tl1.trustline.getRequests(networkAddress)).to.eventually.be.an('array')
      })
    })

    describe('#prepareAccept()', () => {
      it('should prepare accept tx', () => {
        expect(tl2.trustline.prepareAccept(networkAddress, user1.address, 1250))
          .to.eventually.have.keys('rawTx', 'ethFee', 'gasPrice')
      })
    })

    describe('#confirm() accept tx', () => {
      before(done => {
        tl1.trustline.prepareUpdate(networkAddress, user2.address, 1250)
          .then(updateTx => tl1.trustline.confirm(updateTx.rawTx))
          .then(txId => setTimeout(() => done(), 500))
      })

      it('should return txId', done => {
        tl2.trustline.prepareAccept(networkAddress, user1.address, 1250)
          .then(tx => {
            expect(tl2.trustline.confirm(tx.rawTx)).to.eventually.be.a('string')
            setTimeout(() => done(), 500)
          })
      })
    })

    describe('#getUpdates()', () => {
      before(done => {
        tl1.trustline.prepareUpdate(networkAddress, user2.address, 1500)
          .then(({ rawTx }) => tl1.trustline.confirm(rawTx))
          .then(() => setTimeout(() => done(), 500))
      })

      it('should return latest update', done => {
        tl2.trustline.prepareAccept(networkAddress, user1.address, 1500)
          .then(tx => tl2.trustline.confirm(tx.rawTx))
          .then(txId => {
            setTimeout(() => {
              tl2.trustline.getUpdates(networkAddress).then(updates => {
                const latestUpdate = updates[updates.length - 1]
                expect(latestUpdate.address).to.equal(user1.address)
                expect(latestUpdate.amount).to.equal(1500)
                expect(latestUpdate.blockNumber).to.be.a('number')
                expect(latestUpdate.direction).to.equal('received')
                expect(latestUpdate.networkAddress).to.equal(networkAddress)
                expect(latestUpdate.status).to.be.a('string')
                expect(latestUpdate.timestamp).to.be.a('number')
                expect(latestUpdate.transactionId).to.equal(txId)
                expect(latestUpdate.type).to.equal('CreditlineUpdate')
                done()
              })
            }, 500)
          })
      })

      it('should return all updates', () => {
        expect(tl1.trustline.getUpdates(networkAddress)).to.eventually.be.an('array')
      })
    })

    describe('#get()', () => {
      it('should return trustline', () => {
        expect(tl1.trustline.get(networkAddress, user2.address))
          .to.eventually.have.keys('address', 'balance', 'given', 'id', 'leftGiven', 'leftReceived', 'received')
      })
    })

    describe('#getAll()', () => {
      it('should return array of trustlines', () => {
        expect(tl1.trustline.getAll(networkAddress)).to.eventually.be.an('array')
      })
    })
  })
})
