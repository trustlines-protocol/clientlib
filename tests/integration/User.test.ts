import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import { TL_WALLET_DATA_KEYS, tlNetworkConfig, USER_1 } from '../Fixtures'

chai.use(chaiAsPromised)

describe('integration', () => {
  describe('User', () => {
    const { expect } = chai
    const tlNew = new TLNetwork(tlNetworkConfig)
    const tlExisting = new TLNetwork(tlNetworkConfig)
    let newWalletData
    let existingWalletData

    before(async () => {
      ;[newWalletData, existingWalletData] = await Promise.all([
        tlNew.user.create(),
        tlExisting.user.recoverFromSeed(USER_1.mnemonic)
      ])
      await Promise.all([
        tlNew.user.loadFrom(newWalletData),
        tlExisting.user.loadFrom(existingWalletData)
      ])
    })

    describe('#create()', () => {
      it('should create new user walletData', () => {
        expect(newWalletData).to.have.keys(TL_WALLET_DATA_KEYS)
      })
    })

    describe('#loadFrom()', () => {
      it('should load existing user walletData', () => {
        expect(existingWalletData).to.have.keys(TL_WALLET_DATA_KEYS)
        expect(existingWalletData.address).to.eq(USER_1.address)
      })
    })

    describe('#exportPrivateKey()', () => {
      it('should show private key of user', () => {
        expect(tlExisting.user.exportPrivateKey()).to.eventually.be.a('string')
      })
    })

    describe('#showSeed()', () => {
      it('should show seed of loaded user', () => {
        expect(tlExisting.user.showSeed()).to.eventually.eq(USER_1.mnemonic)
      })
    })

    describe('#recoverFromSeed()', () => {
      it('should recover from seed words', async () => {
        const recoveredWalletData = await tlExisting.user.recoverFromSeed(
          USER_1.mnemonic
        )
        expect(recoveredWalletData.address).to.equal(USER_1.address)
        expect(recoveredWalletData).to.have.keys(TL_WALLET_DATA_KEYS)
      })
    })
  })
})
