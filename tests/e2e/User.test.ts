import { BigNumber } from 'bignumber.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import {
  tlNetworkConfig,
  tlNetworkConfigIdentity,
  USER_1_ETHERS_WALLET_V1,
  USER_1_IDENTITY_WALLET_V1,
  wait
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  const parametrizedTest = [
    {
      config: tlNetworkConfig,
      user: USER_1_ETHERS_WALLET_V1,
      walletType: 'Ethers'
    },
    {
      config: tlNetworkConfigIdentity,
      user: USER_1_IDENTITY_WALLET_V1,
      walletType: 'Identity'
    }
  ]
  parametrizedTest.forEach(testParameter => {
    describe(`User for wallet type: ${testParameter.walletType}`, () => {
      const { expect } = chai

      const config = testParameter.config
      const user1 = testParameter.user
      const tlNew = new TLNetwork(config)
      const tlExisting = new TLNetwork(config)

      before(async () => {
        // load users
        await Promise.all([
          tlNew.user.create(),
          tlExisting.user.load(user1.serializedWallet)
        ])
        await tlNew.user.deployIdentity()
        // make sure existing user has eth
        await tlExisting.user.requestEth()
      })

      describe('#getBalance()', () => {
        it('should return 0 balance for newly created user', async () => {
          const balance = await tlNew.user.getBalance()
          expect(balance).to.have.keys('raw', 'value', 'decimals')
          expect(balance.value).to.equal('0')
        })

        it('should return balance for existing user', async () => {
          const balance = await tlExisting.user.getBalance()
          expect(balance).to.have.keys('raw', 'value', 'decimals')
          expect(new BigNumber(balance.raw).toNumber()).to.be.above(0)
        })
      })

      describe('#requestEth()', () => {
        it('should not send eth to existing user', () => {
          expect(tlExisting.user.requestEth()).to.eventually.equal(null)
        })

        it('should send eth to new user', async () => {
          await expect(tlNew.user.requestEth()).to.eventually.not.equal(null)
          await wait()
          const balance = await tlNew.user.getBalance()
          expect(balance).to.have.keys('raw', 'value', 'decimals')
          expect(new BigNumber(balance.raw).toNumber()).to.be.above(0)
        })
      })
    })
  })

  describe(`User for wallet type: Identity`, () => {
    const { expect } = chai

    const tl = new TLNetwork(tlNetworkConfigIdentity)

    describe('#isIdentityDeployed()', () => {
      before(async () => {
        await tl.user.create()
      })

      it('should return false for not deployed identity', async () => {
        const isDeployed = await tl.user.isIdentityDeployed()
        expect(isDeployed).to.equal(false)
      })

      it('should return true for deployed identity', async () => {
        await tl.user.deployIdentity()
        const isDeployed = await tl.user.isIdentityDeployed()
        expect(isDeployed).to.equal(true)
      })
    })
  })
})
