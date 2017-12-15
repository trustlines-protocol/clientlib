import { TLNetwork } from '../src/TLNetwork'
import { expect } from 'chai'
import 'mocha'
import { config, keystore1, user1 } from './Fixtures'

describe('User', () => {

  const tlNetwork = new TLNetwork(config)
  let newUser

  it('should create new user', done => {
    tlNetwork.user.create().then(createdUser => {
      newUser = createdUser
      expect(createdUser).to.be.an('object')
      expect(createdUser).to.have.property('address')
      expect(createdUser).to.have.property('keystore')
      done()
    })
  })

  it('should load existing user/keystore', done => {
    tlNetwork.user.load(keystore1).then(loadedUser => {
      expect(loadedUser).to.be.an('object')
      expect(loadedUser.address).to.equal(user1.address)
      expect(loadedUser).to.have.property('keystore')
      done()
    })
  })

  it('should create onboarding message', done => {
    tlNetwork.user.createOnboardingMsg('testuser', keystore1).then(link => {
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

  // TODO
  // it('should prepare onboarding', done => {
  //   done()
  // })

  // TODO
  // it('should confirm onboarding', done => {
  //   done()
  // })

  it('should return 0 balance for newly created user', done => {
    tlNetwork.user.load(newUser.keystore)
      .then(() => tlNetwork.user.getBalance())
      .then(balance => {
        expect(balance).to.be.a('string')
        expect(balance).to.equal('0')
        done()
      })
    }
  )

  it('should return balance for existing user', done => {
    tlNetwork.user.load(keystore1)
      .then(() => tlNetwork.user.getBalance())
      .then(balance => {
        expect(balance).to.be.a('string')
        expect(parseFloat(balance)).to.be.above(0)
        done()
      })
    }
  )

  // TODO
  // it('should encrypt a message', done => {
  //   done()
  // })

  // TODO
  // it('should decrypt a message', done => {
  //   done()
  // })

  it('should show seed of loaded user', done => {
    tlNetwork.user.load(keystore1)
      .then(() => tlNetwork.user.showSeed())
      .then(seed => {
        const seedArray = seed.split(' ')
        expect(seedArray).to.have.length(12)
        expect(seed).to.equal('mesh park casual casino sorry giraffe half shrug wool anger chef amateur')
        done()
      })
    }
  )

  it('should recover from seed words', done => {
    tlNetwork.user.load(keystore1)
      .then(() => tlNetwork.user.recoverFromSeed('mesh park casual casino sorry giraffe half shrug wool anger chef amateur'))
      .then(recoveredUser => {
        expect(recoveredUser.address).to.equal(user1.address)
        expect(recoveredUser.pubKey).to.equal(user1.pubKey)
        expect(recoveredUser.keystore).to.be.a('string')
        done()
      })
    }
  )

  it('should create a contact link', done => {
    tlNetwork.user.load(keystore1)
      .then(() => tlNetwork.user.createLink('testuser'))
      .then(link => {
        const splitLink = link.split('/')
        expect(splitLink[0]).to.equal('http:') // base url
        expect(splitLink[2]).to.equal('trustlines.network') // base url
        expect(splitLink[3]).to.equal('v1') // base url
        expect(splitLink[4]).to.equal('contact') // link type
        expect(splitLink[6]).to.equal('testuser') // username
        done()
      })
    }
  )

  it('should not send eth to existing user', done => {
    tlNetwork.user.load(keystore1)
      .then(() => tlNetwork.user.requestEth())
      .then(txId => {
        expect(txId).to.equal(null)
        done()
      })
  })

  it('new user should receive eth', done => {
    tlNetwork.user.load(newUser.keystore)
      .then(() => tlNetwork.user.requestEth())
      .then(() => tlNetwork.user.getBalance())
      .then(balance => {
        expect(balance).to.equal('1')
        done()
      })
  })


})
