import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'

import {
  createAndLoadUsers,
  deployIdentities,
  extraData,
  parametrizedTLNetworkConfig,
  requestEth,
  wait
} from '../Fixtures'

import { UserInformation } from '../../src/UserInformation'

chai.use(chaiAsPromised)

describe('e2e', () => {
  parametrizedTLNetworkConfig.forEach(testParameter => {
    describe(`User information for wallet type: ${testParameter.walletType}`, () => {
      const { expect } = chai

      const config = testParameter.config

      const tl1 = new TLNetwork(config)
      const tl2 = new TLNetwork(config)
      const tl3 = new TLNetwork(config)
      let user1
      let user2
      let user3
      let network
      let userInformation: UserInformation

      before(async () => {
        ;[network] = await tl1.currencyNetwork.getAll()
        // create new users
        ;[user1, user2, user3] = await createAndLoadUsers([tl1, tl2, tl3])
        userInformation = new UserInformation({
          user: tl1.user,
          currencyNetwork: tl1.currencyNetwork,
          provider: tl1.relayProvider
        })
        await deployIdentities([tl1, tl2, tl3])
        // request ETH
        await requestEth([tl1, tl2, tl3])
        await wait()

        const trustlines = [
          [tl1, tl2],
          [tl1, tl3]
        ]
        // Establish all trustlines
        for (const trustline of trustlines) {
          // Get the both users for this trustline.
          const [a, b] = trustline

          // Prepare trustline update transaction from a to b.
          // set trustline with high interest rates to get some accrued interests on a short time
          const { rawTx: rawUpdateTx } = await a.trustline.prepareUpdate(
            network.address,
            b.user.address,
            20000,
            20000,
            {
              interestRateGiven: 20,
              interestRateReceived: 20
            }
          )

          // Prepare trustline accept transaction from b to a.
          const { rawTx: rawAcceptTx } = await b.trustline.prepareAccept(
            network.address,
            a.user.address,
            20000,
            20000,
            {
              interestRateGiven: 20,
              interestRateReceived: 20
            }
          )

          // Sign and relay prepared transactions.
          a.trustline.confirm(rawUpdateTx)
          b.trustline.confirm(rawAcceptTx)
          // wait for txs to be mined
          await wait()
        }
      })

      describe('#getAccruedInterests()', () => {
        before(async () => {
          // bring imbalance to trustline
          const transfer1 = await tl1.payment.prepare(
            network.address,
            user2.address,
            1000
          )
          await tl1.payment.confirm(transfer1.rawTx)
          await wait()

          // apply accrued userInformation to trustline via transfer
          const transfer2 = await tl2.payment.prepare(
            network.address,
            user1.address,
            1000
          )
          await tl2.payment.confirm(transfer2.rawTx)
          await wait()
        })

        it('should return list of accrued interests for user', async () => {
          const userAccruedInterests = await userInformation.getAccruedInterests(
            network.address
          )
          expect(userAccruedInterests).to.be.an('Array')
          expect(userAccruedInterests.length).to.equal(1)

          const trustlineAccruedInterests = userAccruedInterests[0]
          expect(trustlineAccruedInterests.accruedInterests).to.be.an('Array')
          expect(trustlineAccruedInterests.accruedInterests.length).to.equal(1)
          expect(trustlineAccruedInterests.user).to.equal(user1.address)
          expect(trustlineAccruedInterests.counterparty).to.equal(user2.address)

          const accruedInterest = trustlineAccruedInterests.accruedInterests[0]
          expect(accruedInterest.value).to.have.keys('raw', 'value', 'decimals')
          expect(accruedInterest.interestRate).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(accruedInterest.timestamp).to.be.a('number')
        })

        it('should return list of accrued interests for trustline', async () => {
          const trustlineAccruedInterests = await userInformation.getAccruedInterestsOnTrustline(
            network.address,
            user2.address
          )

          expect(trustlineAccruedInterests.accruedInterests).to.be.an('Array')
          expect(trustlineAccruedInterests.accruedInterests.length).to.equal(1)
          expect(trustlineAccruedInterests.user).to.equal(user1.address)
          expect(trustlineAccruedInterests.counterparty).to.equal(user2.address)

          const accruedInterest = trustlineAccruedInterests.accruedInterests[0]
          expect(accruedInterest.value).to.have.keys('raw', 'value', 'decimals')
          expect(accruedInterest.interestRate).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(accruedInterest.timestamp).to.be.a('number')
        })
      })

      describe('#getEarnedMediationFees()', () => {
        let txHash
        let feeValue
        before(async () => {
          // Make a transfer user2 -> user1 -> user3 to get mediation fee on user1
          feeValue = (
            await tl2.payment.getTransferPathInfo(
              network.address,
              user2.address,
              user3.address,
              1000
            )
          ).maxFees.value
          const transfer = await tl2.payment.prepare(
            network.address,
            user3.address,
            1000
          )
          txHash = await tl2.payment.confirm(transfer.rawTx)
          await wait()
        })

        it('should return list of earned mediation fees for user', async () => {
          const userMediationFees = await userInformation.getEarnedMediationFees(
            network.address
          )
          expect(userMediationFees).to.be.have.all.keys([
            'user',
            'network',
            'mediationFees'
          ])
          expect(userMediationFees.user).to.equal(user1.address)
          expect(userMediationFees.network).to.equal(network.address)
          expect(userMediationFees.mediationFees.length).to.equal(1)

          const mediationFee = userMediationFees.mediationFees[0]
          expect(mediationFee.from).to.equal(user2.address)
          expect(mediationFee.to).to.equal(user3.address)
          expect(mediationFee.value).to.have.keys('raw', 'value', 'decimals')
          expect(mediationFee.value.value).to.equal(feeValue)
          expect(mediationFee.transactionHash).to.equal(txHash)
          expect(mediationFee.timestamp).to.be.a('number')
        })
      })
    })
  })
})
