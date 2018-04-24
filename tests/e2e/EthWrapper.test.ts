import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2 } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('EthWrapper', () => {
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
        .then(() => tl1.ethWrapper.getAll())
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
        expect(tl1.ethWrapper.getAll()).to.eventually.be.an('array')
      })
    })

    describe('#prepDeposit()', () => {
      it('should prepare a deposit tx', () => {
        expect(tl1.ethWrapper.prepDeposit(ethWrapperAddress, 0.001))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#confirm() - deposit', () => {
      let balanceBefore
      let tx

      before(done => {
        tl1.user.getBalance()
          .then(balance => balanceBefore = balance)
          .then(() => tl1.ethWrapper.prepDeposit(ethWrapperAddress, 0.001))
          .then(txObj => tx = txObj)
          .then(() => done())
          .catch(e => done(e))
      })

      it('should confirm deposit tx', done => {
        tl1.ethWrapper.confirm(tx.rawTx)
          .then(txId => expect(txId).to.be.a('string'))
          .then(() => new Promise(resolve => setTimeout(resolve(), 1000)))
          .then(() => tl1.user.getBalance())
          .then(balanceAfter => {
            const delta = Math.abs(balanceBefore.raw - balanceAfter.raw)
            expect(delta).to.gte(1000000000000000)
            done()
          })
      })
    })

    describe('#getLogs()', () => {
      before(done => {
        tl1.ethWrapper.prepDeposit(ethWrapperAddress, 0.012345)
          .then(({ rawTx }) => tl1.ethWrapper.confirm(rawTx))
          .then(() => setTimeout(() => done(), 500))
      })

      it('should return all eth wrapper event logs', done => {
        tl1.ethWrapper.getLogs(ethWrapperAddress)
          .then(logs => {
            expect(logs).to.be.an('array')
            expect(logs.length).to.be.gt(0)
            done()
          })
      })

      it('should return latest deposit', done => {
        tl1.ethWrapper.getLogs(ethWrapperAddress)
          .then(logs => {
            const latestLog = logs[logs.length - 1]
            expect(latestLog.address).to.equal(tl1.user.address)
            expect(latestLog.amount).to.have.keys('decimals', 'raw', 'value')
            expect(latestLog.blockNumber).to.be.a('number')
            expect(latestLog.direction).to.equal('sent')
            expect(latestLog.tokenAddress).to.equal(ethWrapperAddress)
            expect(latestLog.status).to.be.a('string')
            expect(latestLog.timestamp).to.be.a('number')
            expect(latestLog.transactionId).to.be.a('string')
            expect(latestLog.type).to.equal('Deposit')
            done()
          })
      })
    })
  })
})
