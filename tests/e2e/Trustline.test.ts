import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import {
  createAndLoadUsers,
  deployIdentities,
  parametrizedTLNetworkConfig,
  setTrustlines,
  wait
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  parametrizedTLNetworkConfig.forEach(testParameter => {
    describe(`Trustline for wallet type: ${testParameter.walletType}`, () => {
      const { expect } = chai

      const config = testParameter.config

      const tl1 = new TLNetwork(config)
      const tl2 = new TLNetwork(config)
      const tl3 = new TLNetwork(config)
      let user1
      let user2
      let user3
      let networks
      let networkDefaultInterestRates
      let networkCustomInterestRates
      let networkWithoutInterestRates

      before(async () => {
        // set network and load users
        ;[networks, [user1, user2, user3]] = await Promise.all([
          tl1.currencyNetwork.getAll(),
          createAndLoadUsers([tl1, tl2, tl3])
        ])
        await deployIdentities([tl1, tl2, tl3])
        // get network details
        const networksWithDetails = await Promise.all(
          networks.map(network => tl1.currencyNetwork.getInfo(network.address))
        )
        // set different networks
        networkDefaultInterestRates = networksWithDetails.find(
          ({ customInterests, defaultInterestRate }) => {
            return !customInterests && defaultInterestRate.raw > 0
          }
        )
        networkCustomInterestRates = networksWithDetails.find(
          ({ customInterests }) => {
            return customInterests
          }
        )
        networkWithoutInterestRates = networksWithDetails.find(
          ({ customInterests, defaultInterestRate }) => {
            return !customInterests && defaultInterestRate.raw === '0'
          }
        )
        // make sure users have eth
        await Promise.all([
          tl1.user.requestEth(),
          tl2.user.requestEth(),
          tl3.user.requestEth()
        ])
        await wait()
      })

      describe('#prepareUpdate()', async () => {
        it('should prepare raw trustline update request tx in network WITHOUT interest rates', async () => {
          await expect(
            tl1.trustline.prepareUpdate(
              networkWithoutInterestRates.address,
              user2.address,
              2000,
              1000
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })

        it('should prepare raw trustline update request tx in network with DEFAULT interest rates', async () => {
          await expect(
            tl1.trustline.prepareUpdate(
              networkDefaultInterestRates.address,
              user2.address,
              2000,
              1000
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })

        it('should prepare raw trustline update request tx in network with CUSTOM interest rates', async () => {
          await expect(
            tl1.trustline.prepareUpdate(
              networkCustomInterestRates.address,
              user2.address,
              2000,
              1000,
              {
                interestRateGiven: 1,
                interestRateReceived: 2,
                isFrozen: false
              }
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })

        it('should prepare raw trustline update request tx with freezing', async () => {
          await expect(
            tl1.trustline.prepareUpdate(
              networkCustomInterestRates.address,
              user2.address,
              2000,
              1000,
              {
                interestRateGiven: 1,
                interestRateReceived: 2,
                isFrozen: true
              }
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })
      })

      describe('#confirm() - trustline update request tx', () => {
        afterEach(async () => {
          // make sure tx is mined
          await wait()
        })

        it('should return txHash for network WITHOUT interest rates', async () => {
          const txWithoutInterestRates = await tl1.trustline.prepareUpdate(
            networkWithoutInterestRates.address,
            user2.address,
            2000,
            1000
          )
          await expect(
            tl1.trustline.confirm(txWithoutInterestRates.rawTx)
          ).to.eventually.be.a('string')
        })

        it('should return txHash for network with DEFAULT interest rates', async () => {
          const txDefaultInterestRates = await tl1.trustline.prepareUpdate(
            networkWithoutInterestRates.address,
            user2.address,
            2000,
            1000
          )
          await expect(
            tl1.trustline.confirm(txDefaultInterestRates.rawTx)
          ).to.eventually.be.a('string')
        })

        it('should return txHash for network with CUSTOM interest rates', async () => {
          const txCustomInterestRates = await tl1.trustline.prepareUpdate(
            networkWithoutInterestRates.address,
            user2.address,
            2000,
            1000,
            {
              interestRateGiven: 0.02,
              interestRateReceived: 0.01,
              isFrozen: false
            }
          )
          await expect(
            tl1.trustline.confirm(txCustomInterestRates.rawTx)
          ).to.eventually.be.a('string')
        })

        it('should return txHash for trustline update request with freezing', async () => {
          const txFreezing = await tl1.trustline.prepareUpdate(
            networkCustomInterestRates.address,
            user2.address,
            2000,
            1000,
            {
              interestRateGiven: 0.02,
              interestRateReceived: 0.01,
              isFrozen: true
            }
          )
          await expect(
            tl1.trustline.confirm(txFreezing.rawTx)
          ).to.eventually.be.a('string')
        })
      })

      describe('#prepareCancelTrustlineUpdate()', async () => {
        it('should prepare cancel trustline update', async () => {
          const { rawTx } = await tl1.trustline.prepareUpdate(
            networkWithoutInterestRates.address,
            user2.address,
            100,
            100
          )
          await tl1.trustline.confirm(rawTx)

          await expect(
            tl1.trustline.prepareCancelTrustlineUpdate(
              networkWithoutInterestRates.address,
              user2.address
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })
      })

      describe('#confirm() - trustline update cancel tx', () => {
        afterEach(async () => {
          // make sure tx is mined
          await wait()
        })

        it('should return txHash for trustline update cancel tx', async () => {
          const { rawTx } = await tl1.trustline.prepareUpdate(
            networkWithoutInterestRates.address,
            user2.address,
            100,
            100
          )
          await tl1.trustline.confirm(rawTx)

          const cancelUpdateTx = await tl1.trustline.prepareCancelTrustlineUpdate(
            networkWithoutInterestRates.address,
            user2.address
          )
          await expect(
            tl1.trustline.confirm(cancelUpdateTx.rawTx)
          ).to.eventually.be.a('string')
        })
      })

      describe('#getRequests()', () => {
        const given = 1500
        const received = 1000
        const interestRateGiven = 0.01
        const interestRateReceived = 0.02
        const isFrozen = false

        it('should return latest request for network WITHOUT interest rates', async () => {
          const { rawTx } = await tl1.trustline.prepareUpdate(
            networkWithoutInterestRates.address,
            user2.address,
            given,
            received
          )
          const txHash = await tl1.trustline.confirm(rawTx)

          // make sure tx is mined
          await wait()

          const requests = await tl1.trustline.getRequests(
            networkWithoutInterestRates.address
          )
          const latestRequest = requests[requests.length - 1]
          expect(latestRequest.direction).to.equal('sent')
          expect(latestRequest.from).to.equal(user1.address)
          expect(latestRequest.transactionHash).to.equal(txHash)
          expect(latestRequest.to).to.equal(user2.address)
          expect(latestRequest.blockNumber).to.be.a('number')
          expect(latestRequest.timestamp).to.be.a('number')
          expect(latestRequest.counterParty).to.equal(user2.address)
          expect(latestRequest.user).to.equal(user1.address)
          expect(latestRequest.networkAddress).to.equal(
            networkWithoutInterestRates.address
          )
          expect(latestRequest.status).to.be.a('string')
          expect(latestRequest.received).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.received.value).to.eq(received.toString())
          expect(latestRequest.given).to.have.keys('raw', 'value', 'decimals')
          expect(latestRequest.given.value).to.eq(given.toString())
          expect(latestRequest.interestRateReceived).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.interestRateReceived.value).to.eq('0')
          expect(latestRequest.interestRateGiven).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.interestRateGiven.value).to.eq('0')
          expect(latestRequest.isFrozen).to.eq(isFrozen)
          expect(latestRequest.type).to.equal('TrustlineUpdateRequest')
        })

        it('should return latest request for network with DEFAULT interest rates', async () => {
          const { rawTx } = await tl1.trustline.prepareUpdate(
            networkDefaultInterestRates.address,
            user2.address,
            given,
            received
          )
          const txHash = await tl1.trustline.confirm(rawTx)

          // make sure tx is mined
          await wait()

          const requests = await tl1.trustline.getRequests(
            networkDefaultInterestRates.address
          )
          const latestRequest = requests[requests.length - 1]
          expect(latestRequest.direction).to.equal('sent')
          expect(latestRequest.from).to.equal(user1.address)
          expect(latestRequest.transactionHash).to.equal(txHash)
          expect(latestRequest.to).to.equal(user2.address)
          expect(latestRequest.blockNumber).to.be.a('number')
          expect(latestRequest.timestamp).to.be.a('number')
          expect(latestRequest.counterParty).to.equal(user2.address)
          expect(latestRequest.user).to.equal(user1.address)
          expect(latestRequest.networkAddress).to.equal(
            networkDefaultInterestRates.address
          )
          expect(latestRequest.status).to.be.a('string')
          expect(latestRequest.received).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.received.value).to.eq(received.toString())
          expect(latestRequest.given).to.have.keys('raw', 'value', 'decimals')
          expect(latestRequest.given.value).to.eq(given.toString())
          expect(latestRequest.interestRateReceived).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.interestRateReceived.value).to.eq(
            networkDefaultInterestRates.defaultInterestRate.value
          )
          expect(latestRequest.interestRateGiven).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.interestRateGiven.value).to.eq(
            networkDefaultInterestRates.defaultInterestRate.value
          )
          expect(latestRequest.isFrozen).to.eq(isFrozen)
          expect(latestRequest.type).to.equal('TrustlineUpdateRequest')
        })

        it('should return latest request for network with CUSTOM interest rates', async () => {
          const { rawTx } = await tl1.trustline.prepareUpdate(
            networkCustomInterestRates.address,
            user2.address,
            given,
            received,
            {
              interestRateGiven,
              interestRateReceived,
              isFrozen
            }
          )
          const txHash = await tl1.trustline.confirm(rawTx)

          // make sure tx is mined
          await wait()

          const requests = await tl1.trustline.getRequests(
            networkCustomInterestRates.address
          )
          const latestRequest = requests[requests.length - 1]
          expect(latestRequest.direction).to.equal('sent')
          expect(latestRequest.from).to.equal(user1.address)
          expect(latestRequest.transactionHash).to.equal(txHash)
          expect(latestRequest.to).to.equal(user2.address)
          expect(latestRequest.blockNumber).to.be.a('number')
          expect(latestRequest.timestamp).to.be.a('number')
          expect(latestRequest.counterParty).to.equal(user2.address)
          expect(latestRequest.user).to.equal(user1.address)
          expect(latestRequest.networkAddress).to.equal(
            networkCustomInterestRates.address
          )
          expect(latestRequest.status).to.be.a('string')
          expect(latestRequest.received).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.received.value).to.eq(received.toString())
          expect(latestRequest.given).to.have.keys('raw', 'value', 'decimals')
          expect(latestRequest.given.value).to.eq(given.toString())
          expect(latestRequest.interestRateReceived).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.interestRateReceived.value).to.eq(
            interestRateReceived.toString()
          )
          expect(latestRequest.interestRateGiven).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.interestRateGiven.value).to.eq(
            interestRateGiven.toString()
          )
          expect(latestRequest.isFrozen).to.eq(isFrozen)
          expect(latestRequest.type).to.equal('TrustlineUpdateRequest')
        })

        it('should return latest request for trustline update request with freezing', async () => {
          const { rawTx } = await tl1.trustline.prepareUpdate(
            networkCustomInterestRates.address,
            user2.address,
            given,
            received,
            { interestRateGiven, interestRateReceived, isFrozen: true }
          )
          const txHash = await tl1.trustline.confirm(rawTx)

          // make sure tx is mined
          await wait()

          const requests = await tl1.trustline.getRequests(
            networkCustomInterestRates.address
          )
          const latestRequest = requests[requests.length - 1]
          expect(latestRequest.direction).to.equal('sent')
          expect(latestRequest.from).to.equal(user1.address)
          expect(latestRequest.transactionHash).to.equal(txHash)
          expect(latestRequest.to).to.equal(user2.address)
          expect(latestRequest.blockNumber).to.be.a('number')
          expect(latestRequest.timestamp).to.be.a('number')
          expect(latestRequest.counterParty).to.equal(user2.address)
          expect(latestRequest.user).to.equal(user1.address)
          expect(latestRequest.networkAddress).to.equal(
            networkCustomInterestRates.address
          )
          expect(latestRequest.status).to.be.a('string')
          expect(latestRequest.received).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.received.value).to.eq(received.toString())
          expect(latestRequest.given).to.have.keys('raw', 'value', 'decimals')
          expect(latestRequest.given.value).to.eq(given.toString())
          expect(latestRequest.interestRateReceived).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.interestRateReceived.value).to.eq(
            interestRateReceived.toString()
          )
          expect(latestRequest.interestRateGiven).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestRequest.interestRateGiven.value).to.eq(
            interestRateGiven.toString()
          )
          expect(latestRequest.isFrozen).to.eq(true)
          expect(latestRequest.type).to.equal('TrustlineUpdateRequest')
        })
      })

      describe('#getTrustlineUpdateCancels()', () => {
        it('should return latest trustline update cancel', async () => {
          const { rawTx } = await tl1.trustline.prepareUpdate(
            networkWithoutInterestRates.address,
            user2.address,
            100,
            100
          )

          const cancelUpdateTx = await tl1.trustline.prepareCancelTrustlineUpdate(
            networkWithoutInterestRates.address,
            user2.address
          )
          const txHash = await tl1.trustline.confirm(cancelUpdateTx.rawTx)

          // make sure tx is mined
          await wait()

          const requests = await tl1.trustline.getTrustlineUpdateCancels(
            networkWithoutInterestRates.address
          )
          const latestRequest = requests[requests.length - 1]
          expect(latestRequest.direction).to.equal('sent')
          expect(latestRequest.from).to.equal(user1.address)
          expect(latestRequest.transactionHash).to.equal(txHash)
          expect(latestRequest.to).to.equal(user2.address)
          expect(latestRequest.blockNumber).to.be.a('number')
          expect(latestRequest.timestamp).to.be.a('number')
          expect(latestRequest.counterParty).to.equal(user2.address)
          expect(latestRequest.user).to.equal(user1.address)
          expect(latestRequest.networkAddress).to.equal(
            networkWithoutInterestRates.address
          )
          expect(latestRequest.status).to.be.a('string')
          expect(latestRequest.type).to.equal('TrustlineUpdateCancel')
        })
      })

      describe('#getTrustlineBalanceUpdates()', () => {
        it('should return latest trustline balance update', async () => {
          await setTrustlines(
            networkWithoutInterestRates.address,
            tl1,
            tl2,
            100,
            100
          )

          const balanceUpdateEventsBefore = await tl1.trustline.getTrustlineBalanceUpdates(
            networkWithoutInterestRates.address,
            await tl2.user.getAddress(),
            { fromBlock: 0 }
          )

          const transferTx = await tl1.payment.prepare(
            networkWithoutInterestRates.address,
            user2.address,
            1
          )
          const txHash = await tl1.trustline.confirm(transferTx.rawTx)

          // make sure tx is mined
          await wait()

          const balanceUpdateEvents = await tl1.trustline.getTrustlineBalanceUpdates(
            networkWithoutInterestRates.address,
            await tl2.user.getAddress()
          )

          expect(balanceUpdateEvents.length).to.be.equal(
            balanceUpdateEventsBefore.length + 1
          )

          const latestBalanceUpdate =
            balanceUpdateEvents[balanceUpdateEvents.length - 1]
          expect(latestBalanceUpdate.direction).to.equal('sent')
          expect(latestBalanceUpdate.from).to.equal(user1.address)
          expect(latestBalanceUpdate.transactionHash).to.equal(txHash)
          expect(latestBalanceUpdate.to).to.equal(user2.address)
          expect(latestBalanceUpdate.blockNumber).to.be.a('number')
          expect(latestBalanceUpdate.timestamp).to.be.a('number')
          expect(latestBalanceUpdate.counterParty).to.equal(user2.address)
          expect(latestBalanceUpdate.user).to.equal(user1.address)
          expect(latestBalanceUpdate.networkAddress).to.equal(
            networkWithoutInterestRates.address
          )
          expect(latestBalanceUpdate.status).to.be.a('string')
          expect(latestBalanceUpdate.type).to.equal('BalanceUpdate')
          expect(latestBalanceUpdate.amount.value).to.equal('-1')

          // Send back to clean up
          const cleanupTransferTx = await tl2.payment.prepare(
            networkWithoutInterestRates.address,
            user1.address,
            1
          )
          await tl2.trustline.confirm(cleanupTransferTx.rawTx)
        })
      })

      describe('#prepareAccept()', () => {
        it('should prepare accept tx for network WITHOUT interest rates', async () => {
          await expect(
            tl2.trustline.prepareAccept(
              networkWithoutInterestRates.address,
              user1.address,
              1250,
              1000
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })

        it('should prepare accept tx for network with DEFAULT interest rates', async () => {
          await expect(
            tl2.trustline.prepareAccept(
              networkDefaultInterestRates.address,
              user1.address,
              1250,
              1000
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })

        it('should prepare accept tx for network with CUSTOM interest rates', () => {
          expect(
            tl2.trustline.prepareAccept(
              networkCustomInterestRates.address,
              user1.address,
              1250,
              1000,
              {
                interestRateGiven: 0.01,
                interestRateReceived: 0.02,
                isFrozen: false
              }
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })

        it('should prepare accept tx for trustline update with freezing', async () => {
          await expect(
            tl2.trustline.prepareAccept(
              networkCustomInterestRates.address,
              user1.address,
              1250,
              1000,
              {
                interestRateGiven: 0.02,
                interestRateReceived: 0.01,
                isFrozen: true
              }
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })
      })

      describe('#getUpdates()', () => {
        const given = 3000
        const received = 2000
        const interestRateGiven = 0.03
        const interestRateReceived = 0.02
        const isFrozen = false

        let acceptTxHashWithoutInterestRates
        let acceptTxHashDefaultInterestRates
        let acceptTxHashCustomInterestRates

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
              interestRateReceived,
              isFrozen
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
          acceptTxHashWithoutInterestRates = await tl2.trustline.confirm(
            acceptTxWithoutInterestRates.rawTx
          )

          await wait()

          const acceptTxDefaultInterestRates = await tl2.trustline.prepareAccept(
            networkDefaultInterestRates.address,
            user1.address,
            received,
            given
          )
          acceptTxHashDefaultInterestRates = await tl2.trustline.confirm(
            acceptTxDefaultInterestRates.rawTx
          )

          await wait()

          const acceptTxCustomInterestRates = await tl2.trustline.prepareAccept(
            networkCustomInterestRates.address,
            user1.address,
            received,
            given,
            {
              interestRateGiven: interestRateReceived,
              interestRateReceived: interestRateGiven,
              isFrozen
            }
          )
          acceptTxHashCustomInterestRates = await tl2.trustline.confirm(
            acceptTxCustomInterestRates.rawTx
          )

          await wait()
        })

        it('should return latest update for network WITHOUT interest rates', async () => {
          const updates = await tl1.trustline.getUpdates(
            networkWithoutInterestRates.address
          )
          const latestUpdate = updates[updates.length - 1]
          expect(latestUpdate.direction).to.equal('sent')
          expect(latestUpdate.from).to.equal(user1.address)
          expect(latestUpdate.to).to.equal(user2.address)
          expect(latestUpdate.counterParty).to.equal(user2.address)
          expect(latestUpdate.user).to.equal(user1.address)
          expect(latestUpdate.blockNumber).to.be.a('number')
          expect(latestUpdate.timestamp).to.be.a('number')
          expect(latestUpdate.networkAddress).to.equal(
            networkWithoutInterestRates.address
          )
          expect(latestUpdate.status).to.be.a('string')
          expect(latestUpdate.transactionHash).to.equal(
            acceptTxHashWithoutInterestRates
          )
          expect(latestUpdate.type).to.equal('TrustlineUpdate')
          expect(latestUpdate.received).to.have.keys('raw', 'value', 'decimals')
          expect(latestUpdate.received.value).to.eq(received.toString())
          expect(latestUpdate.given).to.have.keys('raw', 'value', 'decimals')
          expect(latestUpdate.given.value).to.eq(given.toString())
          expect(latestUpdate.interestRateReceived).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestUpdate.interestRateReceived.value).to.eq('0')
          expect(latestUpdate.interestRateGiven).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestUpdate.interestRateGiven.value).to.eq('0')
          expect(latestUpdate.isFrozen).to.eq(isFrozen)
        })

        it('should return latest update for network with DEFAULT interest rates', async () => {
          const updates = await tl1.trustline.getUpdates(
            networkDefaultInterestRates.address
          )
          const latestUpdate = updates[updates.length - 1]
          expect(latestUpdate.direction).to.equal('sent')
          expect(latestUpdate.from).to.equal(user1.address)
          expect(latestUpdate.to).to.equal(user2.address)
          expect(latestUpdate.counterParty).to.equal(user2.address)
          expect(latestUpdate.user).to.equal(user1.address)
          expect(latestUpdate.blockNumber).to.be.a('number')
          expect(latestUpdate.timestamp).to.be.a('number')
          expect(latestUpdate.networkAddress).to.equal(
            networkDefaultInterestRates.address
          )
          expect(latestUpdate.status).to.be.a('string')
          expect(latestUpdate.transactionHash).to.equal(
            acceptTxHashDefaultInterestRates
          )
          expect(latestUpdate.type).to.equal('TrustlineUpdate')
          expect(latestUpdate.received).to.have.keys('raw', 'value', 'decimals')
          expect(latestUpdate.received.value).to.eq(received.toString())
          expect(latestUpdate.given).to.have.keys('raw', 'value', 'decimals')
          expect(latestUpdate.given.value).to.eq(given.toString())
          expect(latestUpdate.interestRateReceived).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestUpdate.interestRateReceived.value).to.eq(
            networkDefaultInterestRates.defaultInterestRate.value
          )
          expect(latestUpdate.interestRateGiven).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestUpdate.interestRateGiven.value).to.eq(
            networkDefaultInterestRates.defaultInterestRate.value
          )
          expect(latestUpdate.isFrozen).to.eq(isFrozen)
        })

        it('should return latest update for network with CUSTOM interest rates', async () => {
          const updates = await tl1.trustline.getUpdates(
            networkCustomInterestRates.address
          )
          const latestUpdate = updates[updates.length - 1]
          expect(latestUpdate.direction).to.equal('sent')
          expect(latestUpdate.from).to.equal(user1.address)
          expect(latestUpdate.to).to.equal(user2.address)
          expect(latestUpdate.counterParty).to.equal(user2.address)
          expect(latestUpdate.user).to.equal(user1.address)
          expect(latestUpdate.blockNumber).to.be.a('number')
          expect(latestUpdate.timestamp).to.be.a('number')
          expect(latestUpdate.networkAddress).to.equal(
            networkCustomInterestRates.address
          )
          expect(latestUpdate.status).to.be.a('string')
          expect(latestUpdate.transactionHash).to.equal(
            acceptTxHashCustomInterestRates
          )
          expect(latestUpdate.type).to.equal('TrustlineUpdate')
          expect(latestUpdate.received).to.have.keys('raw', 'value', 'decimals')
          expect(latestUpdate.received.value).to.eq(received.toString())
          expect(latestUpdate.given).to.have.keys('raw', 'value', 'decimals')
          expect(latestUpdate.given.value).to.eq(given.toString())
          expect(latestUpdate.interestRateReceived).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestUpdate.interestRateReceived.value).to.eq(
            interestRateReceived.toString()
          )
          expect(latestUpdate.interestRateGiven).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestUpdate.interestRateGiven.value).to.eq(
            interestRateGiven.toString()
          )
          expect(latestUpdate.isFrozen).to.eq(isFrozen)
        })
      })

      describe('#getUpdates() for freezing a trustline', () => {
        const given = 3000
        const received = 2000
        const interestRateGiven = 0.03
        const interestRateReceived = 0.02
        const isFrozen = true

        let acceptTxHash

        before(async () => {
          const updateTx = await tl1.trustline.prepareUpdate(
            networkCustomInterestRates.address,
            user2.address,
            given,
            received,
            { interestRateGiven, interestRateReceived, isFrozen }
          )
          await tl1.trustline.confirm(updateTx.rawTx)

          await wait()

          const acceptTx = await tl2.trustline.prepareAccept(
            networkCustomInterestRates.address,
            user1.address,
            received,
            given,
            {
              interestRateGiven: interestRateReceived,
              interestRateReceived: interestRateGiven,
              isFrozen
            }
          )
          acceptTxHash = await tl2.trustline.confirm(acceptTx.rawTx)

          await wait()
        })

        after(async () => {
          // make sure TL is not frozen for other tests
          const updateTxCustomInterestRates = await tl1.trustline.prepareUpdate(
            networkCustomInterestRates.address,
            user2.address,
            given,
            received,
            {
              interestRateGiven,
              interestRateReceived,
              isFrozen: false
            }
          )
          await tl1.trustline.confirm(updateTxCustomInterestRates.rawTx)

          const acceptTxCustomInterestRates = await tl2.trustline.prepareAccept(
            networkCustomInterestRates.address,
            user1.address,
            received,
            given,
            {
              interestRateGiven: interestRateReceived,
              interestRateReceived: interestRateGiven,
              isFrozen: false
            }
          )
          await tl2.trustline.confirm(acceptTxCustomInterestRates.rawTx)

          await wait()
        })

        it('should return latest update for trustline update with freezing', async () => {
          const updates = await tl1.trustline.getUpdates(
            networkCustomInterestRates.address
          )
          const latestUpdate = updates[updates.length - 1]
          expect(latestUpdate.direction).to.equal('sent')
          expect(latestUpdate.from).to.equal(user1.address)
          expect(latestUpdate.to).to.equal(user2.address)
          expect(latestUpdate.counterParty).to.equal(user2.address)
          expect(latestUpdate.user).to.equal(user1.address)
          expect(latestUpdate.blockNumber).to.be.a('number')
          expect(latestUpdate.timestamp).to.be.a('number')
          expect(latestUpdate.networkAddress).to.equal(
            networkCustomInterestRates.address
          )
          expect(latestUpdate.status).to.be.a('string')
          expect(latestUpdate.transactionHash).to.equal(acceptTxHash)
          expect(latestUpdate.type).to.equal('TrustlineUpdate')
          expect(latestUpdate.received).to.have.keys('raw', 'value', 'decimals')
          expect(latestUpdate.received.value).to.eq(received.toString())
          expect(latestUpdate.given).to.have.keys('raw', 'value', 'decimals')
          expect(latestUpdate.given.value).to.eq(given.toString())
          expect(latestUpdate.interestRateReceived).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestUpdate.interestRateReceived.value).to.eq(
            interestRateReceived.toString()
          )
          expect(latestUpdate.interestRateGiven).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(latestUpdate.interestRateGiven.value).to.eq(
            interestRateGiven.toString()
          )
          expect(latestUpdate.isFrozen).to.eq(isFrozen)
        })
      })

      describe('#get()', () => {
        it('should return trustline', async () => {
          const trustline = await tl1.trustline.get(
            networkWithoutInterestRates.address,
            user2.address
          )
          expect(trustline).to.include.all.keys([
            'counterParty',
            'currencyNetwork',
            'user',
            'balance',
            'given',
            'id',
            'leftGiven',
            'leftReceived',
            'received',
            'interestRateGiven',
            'interestRateReceived',
            'isFrozen'
          ])
        })
      })

      describe('#getAll()', () => {
        it('should return array of trustlines', async () => {
          await expect(
            tl1.trustline.getAll(networkWithoutInterestRates.address)
          ).to.eventually.be.an('array')
        })
      })

      describe('#getAllOfUser()', () => {
        before(async () => {
          await setTrustlines(
            networkCustomInterestRates.address,
            tl3,
            tl1,
            1,
            2
          )
          await setTrustlines(
            networkDefaultInterestRates.address,
            tl3,
            tl1,
            10,
            20
          )
          await setTrustlines(
            networkWithoutInterestRates.address,
            tl3,
            tl1,
            100,
            200
          )
        })

        it('should return all trustlines across different networks', async () => {
          const allTrustlines = await tl3.trustline.getAllOfUser()
          expect(allTrustlines.length).to.equal(3)
        })
      })

      describe('#prepareClose() - non triangulated transfer', () => {
        const given = 10
        const received = 20

        before(async () => {
          const [updateTx, acceptTx] = await Promise.all([
            tl1.trustline.prepareUpdate(
              networkWithoutInterestRates.address,
              tl2.user.address,
              given,
              received
            ),
            tl2.trustline.prepareAccept(
              networkWithoutInterestRates.address,
              tl1.user.address,
              received,
              given
            )
          ])
          // Sign and relay prepared transactions.
          await Promise.all([
            tl1.trustline.confirm(updateTx.rawTx),
            tl2.trustline.confirm(acceptTx.rawTx)
          ])
          // Wait for txs to be mined.
          await wait()
        })

        it('should prepare a close without a triangulated transfer', async () => {
          // Send the prepare settle to the relay, expecting a valid path exists.
          const closeTx = await tl1.trustline.prepareClose(
            networkWithoutInterestRates.address,
            tl2.user.address
          )
          expect(closeTx).to.have.all.keys([
            'rawTx',
            'txFees',
            'maxFees',
            'path'
          ])
          expect(closeTx.path.length).to.equal(0)
          expect(closeTx.txFees).to.contain.keys([
            'baseFee',
            'gasPrice',
            'gasLimit',
            'totalFee'
          ])
          expect(closeTx.maxFees).to.have.all.keys(['raw', 'value', 'decimals'])
        })

        it('should sign and relay prepared close transaction without triangulated transfer', async () => {
          // Prepare close transaction
          const { rawTx: rawCloseTx } = await tl1.trustline.prepareClose(
            networkWithoutInterestRates.address,
            tl2.user.address
          )

          // Sign and relay close transaction
          await tl1.trustline.confirm(rawCloseTx)

          // Wait for tx to be mined
          await wait()

          // Get trustline infos
          const trustline = await tl1.trustline.get(
            networkWithoutInterestRates.address,
            tl2.user.address
          )

          // Given and received of closed trustline from user 1 to user 2 should be 0
          expect(trustline.given.value).to.equal('0')
          expect(trustline.received.value).to.equal('0')
        })
      })

      describe('#prepareClose() - triangulated transfer', () => {
        const given = 1000
        const received = 1000
        const transferAmount = 100

        before(async () => {
          // Construction of three accounts as clique.
          const triangle = [[tl1, tl2], [tl2, tl3], [tl3, tl1]]

          // Establish all trustlines in the triangle.
          for (const trustline of triangle) {
            // Get the both users for this trustline.
            const [a, b] = trustline

            // Prepare trustline update transaction from a to b.
            const { rawTx: rawUpdateTx } = await a.trustline.prepareUpdate(
              networkWithoutInterestRates.address,
              b.user.address,
              given,
              received
            )

            // Prepare trustline accept transaction from b to a.
            const { rawTx: rawAcceptTx } = await b.trustline.prepareAccept(
              networkWithoutInterestRates.address,
              a.user.address,
              given,
              received
            )

            // Sign and relay prepared transactions.
            await Promise.all([
              a.trustline.confirm(rawUpdateTx),
              b.trustline.confirm(rawAcceptTx)
            ])

            // Wait for txs to be mined.
            await wait()
          }

          // Manipulate the balance between the user to settle the trustline later on.
          const { rawTx: rawPaymentTx } = await tl1.payment.prepare(
            networkWithoutInterestRates.address,
            tl2.user.address,
            transferAmount
          )
          await tl1.payment.confirm(rawPaymentTx)
          await wait()
        })

        it('should be possible to prepare a close in the correct direction', async () => {
          // Send the prepare settle to the relay, expecting a valid path exists.
          const closeTx = await tl1.trustline.prepareClose(
            networkWithoutInterestRates.address,
            tl2.user.address
          )
          expect(closeTx).to.have.all.keys([
            'rawTx',
            'txFees',
            'maxFees',
            'path'
          ])
          expect(closeTx.path).to.include(tl3.user.address)
          expect(closeTx.txFees).to.contain.keys([
            'baseFee',
            'gasPrice',
            'gasLimit',
            'totalFee'
          ])
          expect(closeTx.maxFees).to.have.all.keys(['raw', 'value', 'decimals'])
        })

        it('should sign and relay prepared close transaction', async () => {
          // Prepare close transaction
          const { rawTx: rawCloseTx } = await tl1.trustline.prepareClose(
            networkWithoutInterestRates.address,
            tl2.user.address
          )

          // Sign and relay close transaction
          await tl1.trustline.confirm(rawCloseTx)

          // Wait for tx to be mined
          await wait()

          // Get trustline infos
          const [
            trustline1To2,
            trustline1To3,
            trustline2To3
          ] = await Promise.all([
            tl1.trustline.get(
              networkWithoutInterestRates.address,
              tl2.user.address
            ),
            tl1.trustline.get(
              networkWithoutInterestRates.address,
              tl3.user.address
            ),
            tl2.trustline.get(
              networkWithoutInterestRates.address,
              tl3.user.address
            )
          ])

          // Balance and credit limits of closed trustline from user 1 to user 2 should be 0
          expect(trustline1To2.balance.value).to.equal('0')
          expect(trustline1To2.given.value).to.equal('0')
          expect(trustline1To2.received.value).to.equal('0')
          // Balance of triangulated trustline from user 1 to user 3 should be -100
          // Credit limits should be 1000
          expect(trustline1To3.balance.value).to.equal('-100')
          expect(trustline1To3.given.value).to.equal('1000')
          expect(trustline1To3.received.value).to.equal('1000')
          // Balance of triangulated trustline from user 2 to user 3 should be 100
          // Credit limits should be 1000
          expect(trustline2To3.balance.value).to.equal('100')
          expect(trustline2To3.given.value).to.equal('1000')
          expect(trustline2To3.received.value).to.equal('1000')
        })
      })
    })
  })
})
