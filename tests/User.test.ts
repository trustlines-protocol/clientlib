import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../src/TLNetwork'
import { config, keystore1, user1 } from './Fixtures'

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
        tlExisting.user.requestEth().then(() => done())
      })
  })

  it('should create new user', () => {
    expect(newUser).to.have.keys('address', 'keystore', 'pubKey')
  })

  it('should load existing user/keystore', () => {
    expect(existingUser).to.have.keys('address', 'keystore', 'pubKey')
    expect(existingUser.address.toLowerCase()).to.equal(user1.address.toLowerCase())
  })

  it('should return 0 balance for newly created user', () => {
    expect(tlNew.user.getBalance()).to.eventually.equal('0')
  })

  it('should return balance for existing user', () => {
    expect(tlExisting.user.getBalance()).to.eventually.equal('1')
  })

  it('should not send eth to existing user', () => {
    expect(tlExisting.user.requestEth()).to.eventually.equal(null)
  })

  it('should send eth to new user', () => {
    expect(tlNew.user.requestEth()).to.eventually.not.equal(null)
    setTimeout(() => {
      expect(tlNew.user.getBalance()).to.eventually.equal('1')
    }, 500)
  })

  it('should create onboarding message', done => {
    tlExisting.user.createOnboardingMsg('testuser', keystore1).then(link => {
      const splitLink = link.split('/')
      expect(splitLink[0]).to.equal('http:') // base url
      expect(splitLink[2]).to.equal('trustlines.network') // base url
      expect(splitLink[3]).to.equal('v1') // base url
      expect(splitLink[4]).to.equal('onboardingrequest') // link type
      expect(splitLink[5]).to.equal('testuser') // username
      expect(splitLink[6]).to.equal(user1.address) // externally owned account address
      expect(splitLink[7]).to.equal(user1.pubKey) // public key
      done()
    })
  })

  it('should show seed of loaded user', () => {
    expect(tlExisting.user.showSeed()).to.eventually
      .equal('mesh park casual casino sorry giraffe half shrug wool anger chef amateur')
  })

  it('should recover from seed words', done => {
    tlExisting.user.recoverFromSeed('mesh park casual casino sorry giraffe half shrug wool anger chef amateur')
      .then(recoveredUser => {
        expect(recoveredUser.address).to.equal(user1.address)
        expect(recoveredUser.pubKey).to.equal(user1.pubKey)
        expect(recoveredUser.keystore).to.be.a('string')
        done()
      })
  })

  it('should create a contact link', done => {
    tlExisting.user.createLink('testuser')
      .then(link => {
        const splitLink = link.split('/')
        expect(splitLink[0]).to.equal('http:') // base url
        expect(splitLink[2]).to.equal('trustlines.network') // base url
        expect(splitLink[3]).to.equal('v1') // base url
        expect(splitLink[4]).to.equal('contact') // link type
        expect(splitLink[6]).to.equal('testuser') // username
        done()
      })
  })

  // TODO
  // it('should prepare onboarding', done => {
  //   done()
  // })

  // TODO
  // it('should confirm onboarding', done => {
  //   done()
  // })

  // TODO
  // it('should encrypt a message', done => {
  //   done()
  // })

  // TODO
  // it('should decrypt a message', done => {
  //   done()
  // })

})
