import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import {
  ACCOUNT_KEYS,
  TL_WALLET_KEYS,
  tlNetworkConfig,
  USER_1
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('integration', () => {
  describe('User', () => {
    const { expect } = chai
    const tlNew = new TLNetwork(tlNetworkConfig)
    const tlExisting = new TLNetwork(tlNetworkConfig)
    let newUser
    let existingUser

    before(async () => {
      ;[newUser, existingUser] = await Promise.all([
        tlNew.user.create(),
        tlExisting.user.recoverFromSeed(USER_1.mnemonic)
      ])
      await Promise.all([
        tlNew.user.load(newUser.wallet),
        tlExisting.user.load(existingUser.wallet)
      ])
    })

    describe('#create()', () => {
      it('should create new user', () => {
        expect(newUser).to.have.keys(ACCOUNT_KEYS)
      })
    })

    describe('#load()', () => {
      it('should load existing user/wallet', () => {
        expect(existingUser).to.have.keys(ACCOUNT_KEYS)
        expect(existingUser.address).to.eq(USER_1.address)
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
        const recoveredUser = await tlExisting.user.recoverFromSeed(
          USER_1.mnemonic
        )
        expect(recoveredUser.address).to.equal(USER_1.address)
        expect(recoveredUser).to.have.keys(ACCOUNT_KEYS)
        expect(recoveredUser.wallet).to.have.keys(TL_WALLET_KEYS)
      })
    })
  })
})
