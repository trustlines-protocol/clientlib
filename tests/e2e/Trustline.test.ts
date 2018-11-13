import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, wait } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Trustline', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let networks
    let networkDefaultInterestRates
    let networkCustomInterestRates
    let networkWithoutInterestRates

    before(async () => {
      // set network and load users
      [ networks, user1, user2 ] = await Promise.all([
        tl1.currencyNetwork.getAll(),
        tl1.user.create(),
        tl2.user.create()
      ])
      // get network details
      const networksWithDetails = await Promise.all(
        networks.map(network => tl1.currencyNetwork.getInfo(network.address))
      )
      // set different networks
      networkDefaultInterestRates = networksWithDetails.find(({ customInterests, defaultInterestRate }) => {
        return !customInterests && defaultInterestRate.raw > 0
      })
      networkCustomInterestRates = networksWithDetails.find(({ customInterests }) => {
        return customInterests
      })
      networkWithoutInterestRates = networksWithDetails.find(({ customInterests, defaultInterestRate }) => {
        return !customInterests && defaultInterestRate.raw === '0'
      })
      // make sure users have eth
      await Promise.all([tl1.user.requestEth(), tl2.user.requestEth()])
      await wait()
    })

    describe('#prepareUpdate()', () => {
      it('should prepare raw trustline update request tx in network WITHOUT interest rates', () => {
        expect(tl1.trustline.prepareUpdate(networkWithoutInterestRates.address, user2.address, 2000, 1000))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })

      it('should prepare raw trustline update request tx in network with DEFAULT interest rates', () => {
        expect(tl1.trustline.prepareUpdate(networkDefaultInterestRates.address, user2.address, 2000, 1000))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })

      it('should prepare raw trustline update request tx in network with CUSTOM interest rates', () => {
        expect(tl1.trustline.prepareUpdate(networkCustomInterestRates.address, user2.address, 2000, 1000, {
          interestRateGiven: 1,
          interestRateReceived: 2
        })).to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#confirm() - trustline update request tx', () => {
      afterEach(async () => {
        // make sure tx is mined
        await wait()
      })

      it('should return txId for network WITHOUT interest rates', async () => {
        const txWithoutInterestRates = await tl1.trustline.prepareUpdate(networkWithoutInterestRates.address, user2.address, 2000, 1000)
        expect(tl1.trustline.confirm(txWithoutInterestRates.rawTx)).to.eventually.be.a('string')
      })

      it('should return txId for network with DEFAULT interest rates', async () => {
        const txDefaultInterestRates = await tl1.trustline.prepareUpdate(networkWithoutInterestRates.address, user2.address, 2000, 1000)
        expect(tl1.trustline.confirm(txDefaultInterestRates.rawTx)).to.eventually.be.a('string')
      })

      it('should return txId for network with CUSTOM interest rates', async () => {
        const txCustomInterestRates = await tl1.trustline.prepareUpdate(networkWithoutInterestRates.address, user2.address, 2000, 1000, {
          interestRateGiven: 0.02,
          interestRateReceived: 0.01
        })
        expect(tl1.trustline.confirm(txCustomInterestRates.rawTx)).to.eventually.be.a('string')
      })
    })

    describe('#getRequests()', () => {
      const given = 1500
      const received = 1000
      const interestRateGiven = 0.01
      const interestRateReceived = 0.02

      it('should return latest request for network WITHOUT interest rates', async () => {
        const { rawTx } = await tl1.trustline.prepareUpdate(networkWithoutInterestRates.address, user2.address, given, received)
        const txId = await tl1.trustline.confirm(rawTx)

        // make sure tx is mined
        await wait()

        const requests = await tl1.trustline.getRequests(networkWithoutInterestRates.address)
        const latestRequest = requests[requests.length - 1]
        expect(latestRequest.direction).to.equal('sent')
        expect(latestRequest.from).to.equal(user1.address)
        expect(latestRequest.transactionId).to.equal(txId)
        expect(latestRequest.to).to.equal(user2.address)
        expect(latestRequest.blockNumber).to.be.a('number')
        expect(latestRequest.timestamp).to.be.a('number')
        expect(latestRequest.counterParty).to.equal(user2.address)
        expect(latestRequest.user).to.equal(user1.address)
        expect(latestRequest.networkAddress).to.equal(networkWithoutInterestRates.address)
        expect(latestRequest.status).to.be.a('string')
        expect(latestRequest.received).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.received.value).to.eq(received.toString())
        expect(latestRequest.given).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.given.value).to.eq(given.toString())
        expect(latestRequest.interestRateReceived).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.interestRateReceived.value).to.eq('0')
        expect(latestRequest.interestRateGiven).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.interestRateGiven.value).to.eq('0')
        expect(latestRequest.type).to.equal('TrustlineUpdateRequest')
      })

      it('should return latest request for network with DEFAULT interest rates', async () => {
        const { rawTx } = await tl1.trustline.prepareUpdate(networkDefaultInterestRates.address, user2.address, given, received)
        const txId = await tl1.trustline.confirm(rawTx)

        // make sure tx is mined
        await wait()

        const requests = await tl1.trustline.getRequests(networkDefaultInterestRates.address)
        const latestRequest = requests[requests.length - 1]
        expect(latestRequest.direction).to.equal('sent')
        expect(latestRequest.from).to.equal(user1.address)
        expect(latestRequest.transactionId).to.equal(txId)
        expect(latestRequest.to).to.equal(user2.address)
        expect(latestRequest.blockNumber).to.be.a('number')
        expect(latestRequest.timestamp).to.be.a('number')
        expect(latestRequest.counterParty).to.equal(user2.address)
        expect(latestRequest.user).to.equal(user1.address)
        expect(latestRequest.networkAddress).to.equal(networkDefaultInterestRates.address)
        expect(latestRequest.status).to.be.a('string')
        expect(latestRequest.received).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.received.value).to.eq(received.toString())
        expect(latestRequest.given).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.given.value).to.eq(given.toString())
        expect(latestRequest.interestRateReceived).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.interestRateReceived.value).to.eq(networkDefaultInterestRates.defaultInterestRate.value)
        expect(latestRequest.interestRateGiven).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.interestRateGiven.value).to.eq(networkDefaultInterestRates.defaultInterestRate.value)
        expect(latestRequest.type).to.equal('TrustlineUpdateRequest')
      })

      it('should return latest request for network with CUSTOM interest rates', async () => {

        const { rawTx } = await tl1.trustline.prepareUpdate(networkCustomInterestRates.address, user2.address, given, received, {
          interestRateGiven,
          interestRateReceived
        })
        const txId = await tl1.trustline.confirm(rawTx)

        // make sure tx is mined
        await wait()

        const requests = await tl1.trustline.getRequests(networkCustomInterestRates.address)
        const latestRequest = requests[requests.length - 1]
        expect(latestRequest.direction).to.equal('sent')
        expect(latestRequest.from).to.equal(user1.address)
        expect(latestRequest.transactionId).to.equal(txId)
        expect(latestRequest.to).to.equal(user2.address)
        expect(latestRequest.blockNumber).to.be.a('number')
        expect(latestRequest.timestamp).to.be.a('number')
        expect(latestRequest.counterParty).to.equal(user2.address)
        expect(latestRequest.user).to.equal(user1.address)
        expect(latestRequest.networkAddress).to.equal(networkCustomInterestRates.address)
        expect(latestRequest.status).to.be.a('string')
        expect(latestRequest.received).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.received.value).to.eq(received.toString())
        expect(latestRequest.given).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.given.value).to.eq(given.toString())
        expect(latestRequest.interestRateReceived).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.interestRateReceived.value).to.eq(interestRateReceived.toString())
        expect(latestRequest.interestRateGiven).to.have.keys('raw', 'value', 'decimals')
        expect(latestRequest.interestRateGiven.value).to.eq(interestRateGiven.toString())
        expect(latestRequest.type).to.equal('TrustlineUpdateRequest')
      })
    })

    describe('#prepareAccept()', () => {
      it('should prepare accept tx for network WITHOUT interest rates', () => {
        expect(tl2.trustline.prepareAccept(networkWithoutInterestRates.address, user1.address, 1250, 1000))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })

      it('should prepare accept tx for network with DEFAULT interest rates', () => {
        expect(tl2.trustline.prepareAccept(networkDefaultInterestRates.address, user1.address, 1250, 1000))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })

      it('should prepare accept tx for network with CUSTOM interest rates', () => {
        expect(tl2.trustline.prepareAccept(networkCustomInterestRates.address, user1.address, 1250, 1000, {
          interestRateGiven: 0.01,
          interestRateReceived: 0.02
        })).to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#getUpdates()', () => {
      const given = 3000
      const received = 2000
      const interestRateGiven = 0.03
      const interestRateReceived = 0.02

      let acceptTxIdWithoutInterestRates
      let acceptTxIdDefaultInterestRates
      let acceptTxIdCustomInterestRates

      before(async () => {
        const updateTxWithoutInterestRates = await tl1.trustline.prepareUpdate(
          networkWithoutInterestRates.address,
          user2.address,
          given,
          received
        )
        await tl1.trustline.confirm(updateTxWithoutInterestRates.rawTx)

        await wait()

        const updateTxDefaultInterestRates = await tl1.trustline.prepareUpdate(
          networkDefaultInterestRates.address,
          user2.address,
          given,
          received
        )
        await tl1.trustline.confirm(updateTxDefaultInterestRates.rawTx)

        await wait()

        const updateTxCustomInterestRates = await tl1.trustline.prepareUpdate(
          networkCustomInterestRates.address,
          user2.address,
          given,
          received,
          {
            interestRateGiven,
            interestRateReceived
          }
        )
        await tl1.trustline.confirm(updateTxCustomInterestRates.rawTx)

        await wait()

        const acceptTxWithoutInterestRates = await tl2.trustline.prepareAccept(
          networkWithoutInterestRates.address,
          user1.address,
          received,
          given
        )
        acceptTxIdWithoutInterestRates = await tl2.trustline.confirm(acceptTxWithoutInterestRates.rawTx)

        await wait()

        const acceptTxDefaultInterestRates = await tl2.trustline.prepareAccept(
          networkDefaultInterestRates.address,
          user1.address,
          received,
          given
        )
        acceptTxIdDefaultInterestRates = await tl2.trustline.confirm(acceptTxDefaultInterestRates.rawTx)

        await wait()

        const acceptTxCustomInterestRates = await tl2.trustline.prepareAccept(
          networkCustomInterestRates.address,
          user1.address,
          received,
          given,
          {
            interestRateGiven: interestRateReceived,
            interestRateReceived: interestRateGiven
          }
        )
        acceptTxIdCustomInterestRates = await tl2.trustline.confirm(acceptTxCustomInterestRates.rawTx)

        await wait()
      })

      it('should return latest update for network WITHOUT interest rates', async () => {
        const updates = await tl1.trustline.getUpdates(networkWithoutInterestRates.address)
        const latestUpdate = updates[updates.length - 1]
        expect(latestUpdate.direction).to.equal('sent')
        expect(latestUpdate.from).to.equal(user1.address)
        expect(latestUpdate.to).to.equal(user2.address)
        expect(latestUpdate.counterParty).to.equal(user2.address)
        expect(latestUpdate.user).to.equal(user1.address)
        expect(latestUpdate.blockNumber).to.be.a('number')
        expect(latestUpdate.timestamp).to.be.a('number')
        expect(latestUpdate.networkAddress).to.equal(networkWithoutInterestRates.address)
        expect(latestUpdate.status).to.be.a('string')
        expect(latestUpdate.transactionId).to.equal(acceptTxIdWithoutInterestRates)
        expect(latestUpdate.type).to.equal('TrustlineUpdate')
        expect(latestUpdate.received).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.received.value).to.eq(received.toString())
        expect(latestUpdate.given).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.given.value).to.eq(given.toString())
        expect(latestUpdate.interestRateReceived).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.interestRateReceived.value).to.eq('0')
        expect(latestUpdate.interestRateGiven).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.interestRateGiven.value).to.eq('0')
      })

      it('should return latest update for network with DEFAULT interest rates', async () => {
        const updates = await tl1.trustline.getUpdates(networkDefaultInterestRates.address)
        const latestUpdate = updates[updates.length - 1]
        expect(latestUpdate.direction).to.equal('sent')
        expect(latestUpdate.from).to.equal(user1.address)
        expect(latestUpdate.to).to.equal(user2.address)
        expect(latestUpdate.counterParty).to.equal(user2.address)
        expect(latestUpdate.user).to.equal(user1.address)
        expect(latestUpdate.blockNumber).to.be.a('number')
        expect(latestUpdate.timestamp).to.be.a('number')
        expect(latestUpdate.networkAddress).to.equal(networkDefaultInterestRates.address)
        expect(latestUpdate.status).to.be.a('string')
        expect(latestUpdate.transactionId).to.equal(acceptTxIdDefaultInterestRates)
        expect(latestUpdate.type).to.equal('TrustlineUpdate')
        expect(latestUpdate.received).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.received.value).to.eq(received.toString())
        expect(latestUpdate.given).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.given.value).to.eq(given.toString())
        expect(latestUpdate.interestRateReceived).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.interestRateReceived.value).to.eq(networkDefaultInterestRates.defaultInterestRate.value)
        expect(latestUpdate.interestRateGiven).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.interestRateGiven.value).to.eq(networkDefaultInterestRates.defaultInterestRate.value)
      })

      it('should return latest update for network with CUSTOM interest rates', async () => {
        const updates = await tl1.trustline.getUpdates(networkCustomInterestRates.address)
        const latestUpdate = updates[updates.length - 1]
        expect(latestUpdate.direction).to.equal('sent')
        expect(latestUpdate.from).to.equal(user1.address)
        expect(latestUpdate.to).to.equal(user2.address)
        expect(latestUpdate.counterParty).to.equal(user2.address)
        expect(latestUpdate.user).to.equal(user1.address)
        expect(latestUpdate.blockNumber).to.be.a('number')
        expect(latestUpdate.timestamp).to.be.a('number')
        expect(latestUpdate.networkAddress).to.equal(networkCustomInterestRates.address)
        expect(latestUpdate.status).to.be.a('string')
        expect(latestUpdate.transactionId).to.equal(acceptTxIdCustomInterestRates)
        expect(latestUpdate.type).to.equal('TrustlineUpdate')
        expect(latestUpdate.received).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.received.value).to.eq(received.toString())
        expect(latestUpdate.given).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.given.value).to.eq(given.toString())
        expect(latestUpdate.interestRateReceived).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.interestRateReceived.value).to.eq(interestRateReceived.toString())
        expect(latestUpdate.interestRateGiven).to.have.keys('raw', 'value', 'decimals')
        expect(latestUpdate.interestRateGiven.value).to.eq(interestRateGiven.toString())
      })
    })

    describe('#get()', () => {
      it('should return trustline', async () => {
        const trustline = await tl1.trustline.get(networkWithoutInterestRates.address, user2.address)
        expect(trustline).to.have.keys([
          'counterParty',
          'user',
          'address',
          'balance',
          'given',
          'id',
          'leftGiven',
          'leftReceived',
          'received',
          'interestRateGiven',
          'interestRateReceived'
        ])
      })
    })

    describe('#getAll()', () => {
      it('should return array of trustlines', () => {
        expect(tl1.trustline.getAll(networkWithoutInterestRates.address)).to.eventually.be.an('array')
      })
    })
  })
})
