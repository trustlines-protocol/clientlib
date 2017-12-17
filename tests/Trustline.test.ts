import { TLNetwork } from '../src/TLNetwork'
import { expect } from 'chai'
import 'mocha'
import { config, keystore1, keystore2 } from './Fixtures'

declare let Promise: any

describe('Trustline', () => {

  const tl1 = new TLNetwork(config)
  const tl2 = new TLNetwork(config)
  let user1
  let user2
  let rawTx
  let networkAddress

  before( (done) => {
    tl1.currencyNetwork.getAll().then(results => {
      networkAddress = results[0].address
      done()
    })
  })

  it('should prepare creditline update', done => {
    Promise.all([tl1.user.load(keystore1), tl2.user.load(keystore2)])
      .then(results => {
        [ user1, user2 ] = results
        tl1.trustline.prepareUpdate(networkAddress, user2.address, 1300).then(txObj => {
          rawTx = txObj.rawTx
          expect(rawTx).to.be.a('string')
          expect(txObj.ethFee).to.be.a('number')
          expect(txObj.gasPrice).to.be.a('number')
          done()
        })
      })
  })

  it('should confirm creditline update', done => {
    tl1.trustline.confirm(rawTx).then(txId => {
      expect(txId).to.be.a('string')
      done()
    })
  })

  it('should prepare creditline accept', done => {
    tl2.trustline.prepareAccept(networkAddress, user1.address, 1300).then(txObj => {
      rawTx = txObj.rawTx
      expect(rawTx).to.be.a('string')
      expect(txObj.ethFee).to.be.a('number')
      expect(txObj.gasPrice).to.be.a('number')
      done()
    })
  })

  it('should confirm creditline accept', done => {
    tl2.trustline.confirm(rawTx).then(txId => {
      expect(txId).to.be.a('string')
      done()
    })
  })

  it('should return updated trustline', done => {
    tl1.trustline.get(networkAddress, user2.address).then(trustline => {
      expect(trustline.given).to.equal(1300)
      expect(trustline.address).to.equal(user2.address)
      done()
    })
  })

  it('should return all trustlines of user', done => {
    tl1.trustline.getAll(networkAddress).then(trustlines => {
      expect(trustlines).to.be.an('array')
      done()
    })
  })

  it('should return all creditline requests', done => {
    tl1.trustline.getRequests(networkAddress).then(requests => {
      const latestRequest = requests[requests.length - 1]
      expect(requests).to.be.an('array')
      expect(latestRequest.networkAddress).to.equal(networkAddress)
      expect(latestRequest.address).to.equal(user2.address)
      expect(latestRequest.amount).to.equal(1300)
      expect(latestRequest.direction).to.equal('sent')
      expect(latestRequest.type).to.equal('CreditlineUpdateRequest')
      done()
    })
  })

  it('should return all creditline updates', done => {
    tl1.trustline.getUpdates(networkAddress).then(updates => {
      const latestUpdate = updates[updates.length - 1]
      expect(updates).to.be.an('array')
      expect(latestUpdate.networkAddress).to.equal(networkAddress)
      expect(latestUpdate.address).to.equal(user2.address)
      expect(latestUpdate.amount).to.equal(1300)
      expect(latestUpdate.direction).to.equal('sent')
      expect(latestUpdate.type).to.equal('CreditlineUpdate')
      done()
    })
  })

})
