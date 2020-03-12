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
  parametrizedTLNetworkConfig
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
    })
  })
})
