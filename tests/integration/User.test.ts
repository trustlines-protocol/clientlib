import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import { config, USER_1 } from '../Fixtures'

chai.use(chaiAsPromised)

describe('integration', () => {
  describe('User', () => {
    const { expect } = chai
    const tlNew = new TLNetwork(config)
    const tlExisting = new TLNetwork(config)
    let newUser
    let existingUser

    before(async () => {
      ;[newUser, existingUser] = await Promise.all([
        tlNew.user.create(),
        tlExisting.user.load(USER_1.keystore)
      ])
    })

    describe('#create()', () => {
      it('should create new user', () => {
        expect(newUser).to.have.keys('address', 'keystore', 'pubKey')
      })
    })

    describe('#load()', () => {
      it('should load existing user/keystore', () => {
        expect(existingUser).to.have.keys('address', 'keystore', 'pubKey')
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
        expect(recoveredUser.pubKey).to.equal(USER_1.pubKey)
        expect(recoveredUser.keystore).to.be.a('string')
      })
    })
  })
})
