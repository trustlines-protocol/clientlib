import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, user1 } from '../Fixtures'

describe('unit', () => {
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

    describe('#createOnboardingMsg()', () => {
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
    })

    describe('#createLink()', () => {
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
    })

    // TODO
    // it('should prepare onboarding', done => {
    //   done()
    // })

    // TODO
    // it('should confirm onboarding', done => {
    //   done()
    // })

  })
})
