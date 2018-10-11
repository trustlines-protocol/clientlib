import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2, wait } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Trustline', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let network

    before(async () => {
      // set network and load users
      [ [ network ], user1, user2 ] = await Promise.all([
        tl1.currencyNetwork.getAll(),
        tl1.user.load(keystore1),
        tl2.user.load(keystore2)
      ])
      // make sure users have eth
      await Promise.all([tl1.user.requestEth(), tl2.user.requestEth()])
      await wait()
    })

    describe('#prepareUpdate()', () => {
      it('should prepare raw trustline update request tx', () => {
        expect(tl1.trustline.prepareUpdate(
          network.address, user2.address, 1300, 1000
        )).to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#confirm() - trustline update request tx', () => {
      let tx

      before(async () => {
        tx = await tl1.trustline.prepareUpdate(network.address, user2.address, 1300, 1000)
        await wait()
      })

      it('should return txId', () => {
        expect(tl1.trustline.confirm(tx.rawTx))
          .to.eventually.be.a('string')
      })

      after(async () => {
        // make sure tx is mined
        await wait()
      })
    })

    describe('#getRequests()', () => {
      const given = 1500
      const received = 1000
      let txId

      before(async () => {
        const { rawTx } = await tl1.trustline.prepareUpdate(network.address, user2.address, given, received)
        txId = await tl1.trustline.confirm(rawTx)
        await wait()
      })

      it('should return all requests', () => {
        expect(tl1.trustline.getRequests(network.address))
          .to.eventually.be.an('array')
      })

      it('should return latest request', async () => {
        const requests = await tl1.trustline.getRequests(network.address)
        const latestRequest = requests[requests.length - 1]
        expect(latestRequest.direction).to.equal('sent')
        expect(latestRequest.from).to.equal(user1.address)
        expect(latestRequest.transactionId).to.equal(txId)
        expect(latestRequest.to).to.equal(user2.address)
        expect(latestRequest.blockNumber).to.be.a('number')
        expect(latestRequest.timestamp).to.be.a('number')
        expect(latestRequest.counterParty).to.equal(user2.address)
        expect(latestRequest.user).to.equal(user1.address)
        expect(latestRequest.networkAddress).to.equal(network.address)
        expect(latestRequest.status).to.be.a('string')
        expect(latestRequest.received).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.received.value).to.eq(received.toString())
        expect(latestRequest.given).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.given.value).to.eq(given.toString())
        expect(latestRequest.type).to.equal('TrustlineUpdateRequest')
      })
    })

    describe('#prepareAccept()', () => {
      it('should prepare accept tx', () => {
        expect(tl2.trustline.prepareAccept(network.address, user1.address, 1250, 1000))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#confirm() - trustline update accept tx', () => {
      before(async () => {
        const { rawTx } = await tl1.trustline.prepareUpdate(network.address, user2.address, 1300, 123)
        await tl1.trustline.confirm(rawTx)
        await wait()
      })

      it('should return txId', async () => {
        const { rawTx } = await tl2.trustline.prepareAccept(network.address, user1.address, 123, 1300)
        expect(tl2.trustline.confirm(rawTx))
          .to.eventually.be.a('string')
      })

      after(async () => {
        // make sure tx got mined
        await wait()
      })
    })

    describe('#getUpdates()', () => {
      const given = 123
      const received = 321

      before(async () => {
        const { rawTx } = await tl1.trustline.prepareUpdate(
          network.address,
          user2.address,
          given,
          received
        )
        await tl1.trustline.confirm(rawTx)
        await wait()
      })

      it('should return all updates', () => {
        expect(tl1.trustline.getUpdates(network.address))
          .to.eventually.be.an('array')
      })

      it('should return latest update', async () => {
        const { rawTx } = await tl2.trustline.prepareAccept(
          network.address,
          user1.address,
          received,
          given
        )
        const txId = await tl2.trustline.confirm(rawTx)
        await wait()
        const updates = await tl1.trustline.getUpdates(network.address)
        const latestUpdate = updates[updates.length - 1]
        expect(latestUpdate.direction).to.equal('sent')
        expect(latestUpdate.from).to.equal(user1.address)
        expect(latestUpdate.to).to.equal(user2.address)
        expect(latestUpdate.counterParty).to.equal(user2.address)
        expect(latestUpdate.user).to.equal(user1.address)
        expect(latestUpdate.blockNumber).to.be.a('number')
        expect(latestUpdate.timestamp).to.be.a('number')
        expect(latestUpdate.networkAddress).to.equal(network.address)
        expect(latestUpdate.status).to.be.a('string')
        expect(latestUpdate.transactionId).to.equal(txId)
        expect(latestUpdate.type).to.equal('TrustlineUpdate')
        expect(latestUpdate.received).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.received.value).to.eq(received.toString())
        expect(latestUpdate.given).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.given.value).to.eq(given.toString())
      })
    })

    describe('#get()', () => {
      it('should return trustline', async () => {
        const trustline = await tl1.trustline.get(network.address, user2.address)
        expect(trustline).to.have.keys('counterParty', 'user', 'address', 'balance', 'given', 'id', 'leftGiven', 'leftReceived', 'received')
      })
    })

    describe('#getAll()', () => {
      it('should return array of trustlines', () => {
        expect(tl1.trustline.getAll(network.address)).to.eventually.be.an('array')
      })
    })
  })
})
