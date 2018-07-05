import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, user1 } from '../Fixtures'

chai.use(chaiAsPromised)

describe('integration', () => {
  describe('User', () => {
    const { expect } = chai
    const tlNew = new TLNetwork(config)
    const tlExisting = new TLNetwork(config)
    const seedUser1 = 'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'
    let newUser
    let existingUser

    before(async () => {
      [ newUser, existingUser ] = await Promise.all([
        tlNew.user.create(),
        tlExisting.user.load(keystore1)
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
        expect(existingUser.address).to.eq(user1.address)
      })
    })

    describe('#exportPrivateKey()', () => {
      it('should show private key of user', () => {
        expect(tlExisting.user.exportPrivateKey()).to.eventually.be.a('string')
      })
    })

    describe('#showSeed()', () => {
      it('should show seed of loaded user', () => {
        expect(tlExisting.user.showSeed()).to.eventually.eq(seedUser1)
      })
    })

    describe('#recoverFromSeed()', () => {
      it('should recover from seed words', async () => {
        const recoveredUser = await tlExisting.user.recoverFromSeed(seedUser1)
        expect(recoveredUser.address).to.equal(user1.address)
        expect(recoveredUser.pubKey).to.equal(user1.pubKey)
        expect(recoveredUser.keystore).to.be.a('string')
      })
    })

    describe('#encrypt()', () => {
      it('should return encryption object', () => {
        expect(tlNew.user.encrypt('hello world!', existingUser.pubKey))
          .to.eventually.be.an('object')
      })
    })

    describe('#decrypt()', () => {
      it('should decrypt message', async () => {
        const message = 'hello world!'
        const cipherText = await tlNew.user.encrypt(message, existingUser.pubKey)
        expect(tlExisting.user.decrypt(cipherText, newUser.pubKey))
          .to.eventually.equal('hello world!')
      })
    })
  })
})
