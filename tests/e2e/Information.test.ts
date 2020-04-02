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

import { Information } from '../../src/Information'

chai.use(chaiAsPromised)

describe('e2e', () => {
  parametrizedTLNetworkConfig.forEach(testParameter => {
    describe(`Information for wallet type: ${testParameter.walletType}`, () => {
      const { expect } = chai

      const config = testParameter.config

      const tl1 = new TLNetwork(config)
      const tl2 = new TLNetwork(config)
      let user1
      let user2
      let network
      let information

      before(async () => {
        ;[network] = await tl1.currencyNetwork.getAll()
        // create new users
        ;[user1, user2] = await createAndLoadUsers([tl1, tl2])
        information = new Information({
          user: tl1.user,
          currencyNetwork: tl1.currencyNetwork,
          provider: tl1.relayProvider
        })
        await deployIdentities([tl1, tl2])
        // request ETH
        await requestEth([tl1, tl2])
        await wait()

        const trustlines = [[tl1, tl2]]
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
              interestRateGiven: 300,
              interestRateReceived: 300
            }
          )

          // Prepare trustline accept transaction from b to a.
          const { rawTx: rawAcceptTx } = await b.trustline.prepareAccept(
            network.address,
            a.user.address,
            20000,
            20000,
            {
              interestRateGiven: 300,
              interestRateReceived: 300
            }
          )

          // Sign and relay prepared transactions.
          a.trustline.confirm(rawUpdateTx)
          b.trustline.confirm(rawAcceptTx)
          // wait for txs to be mined
          await wait()
        }
      })

      describe('#getUserAccruedInterests()', () => {
        before(async () => {
          // bring imbalance to trustline
          const transfer1 = await tl1.payment.prepare(
            network.address,
            user2.address,
            1000,
            { extraData }
          )
          await tl1.payment.confirm(transfer1.rawTx)
          await wait()

          // apply accrued interests to trustline via transfer
          const transfer2 = await tl2.payment.prepare(
            network.address,
            user1.address,
            1000,
            { extraData }
          )
          await tl2.payment.confirm(transfer2.rawTx)
          await wait()
        })

        it('should return list of accrued interests for user', async () => {
          const userAccruedInterests = await information.getUserAccruedInterests(
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
          const trustlineAccruedInterests = await information.getTrustlineAccruedInterests(
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
    })
  })
})
