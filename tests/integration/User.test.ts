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
    let newUser
    let existingUser

    before(done => {
      Promise.all([tlNew.user.create(), tlExisting.user.load(keystore1)])
        .then(users => {
          newUser = users[0]
          existingUser = users[1]
          done()
        })
    })

    describe('#create()', () => {
      it('should create new user', () => {
        expect(newUser).to.have.keys('address', 'keystore', 'pubKey')
      })
    })

    describe('#load()', () => {
      it('should load existing user/keystore', () => {
        expect(existingUser).to.have.keys('address', 'keystore', 'pubKey')
        expect(existingUser.address.toLowerCase()).to.equal(user1.address.toLowerCase())
      })
    })

    describe('#exportPrivateKey()', () => {
      it('should show private key of user', () => {
        expect(tlExisting.user.exportPrivateKey()).to.eventually.be.a('string')
      })
    })

    describe('#showSeed()', () => {
      it('should show seed of loaded user', () => {
        expect(tlExisting.user.showSeed()).to.eventually
          .equal('mesh park casual casino sorry giraffe half shrug wool anger chef amateur')
      })
    })

    describe('#recoverFromSeed()', () => {
      it('should recover from seed words', done => {
        tlExisting.user.recoverFromSeed('mesh park casual casino sorry giraffe half shrug wool anger chef amateur')
          .then(recoveredUser => {
            expect(recoveredUser.address).to.equal(user1.address)
            expect(recoveredUser.pubKey).to.equal(user1.pubKey)
            expect(recoveredUser.keystore).to.be.a('string')
            done()
          })
      })
    })

    describe('#encrypt()', () => {
      it('should return encryption object', () => {
        expect(tlNew.user.encrypt('hello world!', existingUser.pubKey))
          .to.eventually.have.keys('version', 'asymAlg', 'hdIndex', 'encPrivKeys')
      })
    })

    describe('#decrypt()', () => {
      it('should decrypt message', () => {
        const message = 'hello world!'
        tlNew.user.encrypt(message, existingUser.pubKey)
          .then(encrypt => {
            expect(tlExisting.user.decrypt(encrypt, newUser.pubKey))
              .to.eventually.equal('hello world!')
          })
      })
    })
  })
})
