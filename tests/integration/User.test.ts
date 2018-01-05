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

    // TODO
    // it('should encrypt a message', done => {
    //   done()
    // })

    // TODO
    // it('should decrypt a message', done => {
    //   done()
    // })
  })
})
