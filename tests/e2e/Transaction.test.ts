import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import BigNumber from 'bignumber.js'
import { TLNetwork } from '../../src/TLNetwork'
import { RawTxObject, TransactionStatus } from '../../src/typings'
import { IdentityWallet } from '../../src/wallets/IdentityWallet'
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

      describe('Transaction status', () => {
        it('should get successful transaction status via txHash', async () => {
          const { rawTx } = await transaction.prepareValueTransaction(
            user1.address,
            user2.address,
            new BigNumber(1)
          )
          let txHash = await transaction.confirm(rawTx)

          if (testParameter.walletType === 'Identity') {
            // We should use the metaTxHash and not the enveloping tx hash returned by confirm
            const identityWallet = (await tl1.signer) as IdentityWallet
            txHash = await identityWallet.hashMetaTransaction(
              identityWallet.buildMetaTransaction(rawTx)
            )
          }

          const txStatus = await transaction.getTxStatus(txHash)

          expect(txStatus.status).to.equal(TransactionStatus.Success)
        })

        if (testParameter.walletType === 'Identity') {
          it('should get failed transaction status', async () => {
            // Could not achieve to relay a failing transaction easily since the relay will reply with `Status 409 | There was an error while relaying this transaction`
            // So only test this with identity
            const { rawTx } = await transaction.prepareValueTransaction(
              user1.address,
              user2.address,
              new BigNumber(10000000000000000000)
            )
            const txHash = await transaction.confirm(rawTx)
            const txStatus =
              testParameter.walletType === 'Identity'
                ? await transaction.getTxStatus(rawTx)
                : await transaction.getTxStatus(txHash)

            expect(txStatus.status).to.equal(TransactionStatus.Failure)
          })

          it('should get successful transaction status via rawTx', async () => {
            // TODO: getting the tx status via rawTx only available for identity for now, need to implement it for ethers
            const { rawTx } = await transaction.prepareValueTransaction(
              user1.address,
              user2.address,
              new BigNumber(1)
            )
            await transaction.confirm(rawTx)
            const txStatus = await transaction.getTxStatus(rawTx)

            expect(txStatus.status).to.equal(TransactionStatus.Success)
          })
        }
      })
    })
  })
})
