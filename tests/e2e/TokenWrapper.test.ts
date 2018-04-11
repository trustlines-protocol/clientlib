import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2 } from '../Fixtures'

chai.use(chaiAsPromised)

describe.only('e2e', () => {
  describe('TokenWrapper', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let ethWrapperAddress

    before(done => {
      // load users
      Promise.all([tl1.user.load(keystore1), tl2.user.load(keystore2)])
        .then(users => [ user1, user2 ] = users)
        // get availabe wrapper contracts
        .then(() => tl1.tokenWrapper.getAll())
        .then(wrappers => {
          ethWrapperAddress = wrappers[0]
        })
        // make sure users have eth
        .then(() => Promise.all([tl1.user.requestEth(), tl2.user.requestEth()]))
        // wait for txs to be mined
        .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
        .then(() => done())
    })

    describe('#getAll()', () => {
      it('should return array of wrapper addresses', () => {
        expect(tl1.tokenWrapper.getAll()).to.eventually.be.an('array')
      })
    })

    describe('#prepDeposit()', () => {
      it('should prepare a deposit tx', () => {
        expect(tl1.tokenWrapper.prepDeposit(ethWrapperAddress, 0.001))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#confirm() - deposit', () => {
      let balanceBefore
      let tx

      before(done => {
        tl1.user.getBalance()
          .then(balance => balanceBefore = balance)
          .then(() => tl1.tokenWrapper.prepDeposit(ethWrapperAddress, 0.001))
          .then(txObj => tx = txObj)
          .then(() => done())
          .catch(e => done(e))
      })

      it('should confirm deposit tx', done => {
        tl1.tokenWrapper.confirm(tx.rawTx)
          .then(txId => expect(txId).to.be.a('string'))
          .then(() => new Promise(resolve => setTimeout(resolve(), 10000)))
          .then(() => tl1.user.getBalance())
          .then(balanceAfter => {
            const delta = Math.abs(balanceBefore.raw - balanceAfter.raw)
            expect(delta).to.gte(1000000000000000)
            done()
          })
      })
    })
  })
})
