import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import BigNumber from 'bignumber.js'
import { TLNetwork } from '../../src/TLNetwork'
import { TransactionStatus } from '../../src/typings'
import { IdentityWallet } from '../../src/wallets/IdentityWallet'
import {
  createAndLoadUsers,
  deployIdentities,
  parametrizedTLNetworkConfig,
  wait
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  parametrizedTLNetworkConfig.forEach(testParameter => {
    describe(`Transaction for wallet type: ${testParameter.walletType}`, () => {
      const { expect } = chai

      const config = testParameter.config

      const tl1 = new TLNetwork(config)
      const tl2 = new TLNetwork(config)
      const transaction = tl1.transaction
      let user1
      let user2
      let network

      before(async () => {
        // set network and load users
        ;[[network], [user1, user2]] = await Promise.all([
          tl1.currencyNetwork.getAll(),
          createAndLoadUsers([tl1, tl2])
        ])
        await deployIdentities([tl1, tl2])
        // make sure users have eth
        await Promise.all([tl1.user.requestEth(), tl2.user.requestEth()])
      })

      describe('#Transaction status', () => {
        it('should get successful transaction status via txHash', async () => {
          const { rawTx } = await transaction.prepareValueTransaction(
            user1.address,
            user2.address,
            new BigNumber(1)
          )
          let txHash = await transaction.confirm(rawTx)

          if (testParameter.walletType === 'Identity') {
            // We should use the metaTxHash and not the enveloping tx hash returned by confirm
            const identityWallet = tl1.signer as IdentityWallet
            txHash = await identityWallet.hashMetaTransaction(
              identityWallet.buildMetaTransaction(rawTx)
            )
          }

          const txStatus = await transaction.getTxStatus(txHash)

          expect(txStatus.status).to.equal(TransactionStatus.Success)
        })

        it('should get successful transaction status via rawTx', async () => {
          const { rawTx } = await transaction.prepareValueTransaction(
            user1.address,
            user2.address,
            new BigNumber(1)
          )
          await transaction.confirm(rawTx)
          const txStatus = await transaction.getTxStatus(rawTx)

          expect(txStatus.status).to.equal(TransactionStatus.Success)
        })

        it('should get not found transaction status for not confirmed transaction', async () => {
          const { rawTx } = await transaction.prepareValueTransaction(
            user1.address,
            user2.address,
            new BigNumber(1)
          )
          const txStatus = await transaction.getTxStatus(rawTx)

          expect(txStatus.status).to.equal(TransactionStatus.NotFound)
        })
      })

      if (testParameter.walletType === 'Identity') {
        describe('#Delegation Fees', () => {
          it('should get applied delegation fees for meta-transaction', async () => {
            const rawTx1 = (
              await transaction.prepareValueTransaction(
                user1.address,
                user2.address,
                new BigNumber(1)
              )
            ).rawTx
            rawTx1.baseFee = '4321'
            rawTx1.currencyNetworkOfFees = network.address
            const txHash1 = await transaction.confirm(rawTx1)
            await wait()

            const rawTx2 = (
              await transaction.prepareValueTransaction(
                user1.address,
                user2.address,
                new BigNumber(1)
              )
            ).rawTx
            rawTx2.baseFee = '1234'
            rawTx2.currencyNetworkOfFees = network.address
            const txHash2 = await transaction.confirm(rawTx2)
            await wait()

            const delegationFeesTx1 = await transaction.getAppliedDelegationFees(
              txHash1
            )
            expect(delegationFeesTx1.length).to.equal(1)
            const delegationFees1 = delegationFeesTx1[0]
            expect(delegationFees1.totalFee.raw).to.equal(rawTx1.baseFee)
            expect(delegationFees1.feeRecipient).to.equal(
              rawTx1.feeRecipient,
              'fee recipient does not match'
            )
            expect(delegationFees1.currencyNetworkOfFees).to.equal(
              network.address
            )

            const delegationFeesTx2 = await transaction.getAppliedDelegationFees(
              txHash2
            )
            expect(delegationFeesTx2.length).to.equal(1)
            const delegationFees2 = delegationFeesTx2[0]
            expect(delegationFees2.totalFee.raw).to.equal(rawTx2.baseFee)
            expect(delegationFees2.feeRecipient).to.equal(
              rawTx2.feeRecipient,
              'fee recipient does not match'
            )
            expect(delegationFees2.currencyNetworkOfFees).to.equal(
              network.address
            )
          })
        })
      }
    })
  })
})
