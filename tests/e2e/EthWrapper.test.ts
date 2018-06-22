import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'bignumber.js'

import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2, wait } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('EthWrapper', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    const depositAmount = 0.002
    const withdrawAmount = 0.001
    let user1
    let user2
    let ethWrapperAddress

    before(async () => {
      // load users
      [ user1, user2 ] = await Promise.all([
        tl1.user.load(keystore1),
        tl2.user.load(keystore2)
      ])
      // get eth wrapper address
      const addresses = await tl1.ethWrapper.getAddresses()
      ethWrapperAddress = addresses[0]
      // make sure users have eth
      await Promise.all([
        tl1.user.requestEth(),
        tl2.user.requestEth()
      ])
      // wait for txs to be mined
      await wait()
    })

    describe('#getAddresses()', () => {
      it('should return array of wrapper addresses', () => {
        expect(tl1.ethWrapper.getAddresses()).to.eventually.be.an('array')
      })
    })

    describe('#prepDeposit()', () => {
      it('should prepare a deposit tx', () => {
        expect(tl1.ethWrapper.prepDeposit(ethWrapperAddress, depositAmount))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#confirm() - deposit', () => {
      let ethBalanceBefore
      let wethBalanceBefore
      let tx

      before(async () => {
        [ ethBalanceBefore, wethBalanceBefore ] = await Promise.all([
          tl1.user.getBalance(),
          tl1.ethWrapper.getBalance(ethWrapperAddress)
        ])
        tx = await tl1.ethWrapper.prepDeposit(ethWrapperAddress, depositAmount)
      })

      it('should confirm deposit tx', async () => {
        expect(tl1.ethWrapper.confirm(tx.rawTx)).to.eventually.be.a('string')
        await wait()
        const [ ethBalanceAfter, wethBalanceAfter ] = await Promise.all([
          tl1.user.getBalance(),
          tl1.ethWrapper.getBalance(ethWrapperAddress)
        ])
        const deltaEth = Math.abs(new BigNumber(ethBalanceBefore.value)
          .minus(new BigNumber(ethBalanceAfter.value)).toNumber())
        const deltaWeth = Math.abs(new BigNumber(wethBalanceBefore.value)
          .minus(new BigNumber(wethBalanceAfter.value)).toNumber())
        expect(depositAmount).to.eq(deltaEth)
        expect(depositAmount).to.eq(deltaWeth)
      })
    })

    describe('#prepWithdraw()', () => {
      it('should prepare withdraw tx', () => {
        expect(tl1.ethWrapper.prepWithdraw(ethWrapperAddress, withdrawAmount))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#confirm() - withdraw', () => {
      let ethBalanceBefore
      let wethBalanceBefore
      let tx

      before(async () => {
        // set balances before withdraw
        [ ethBalanceBefore, wethBalanceBefore ] = await Promise.all([
          tl1.user.getBalance(),
          tl1.ethWrapper.getBalance(ethWrapperAddress)
        ])
        // make sure already deposited
        const { rawTx } = await tl1.ethWrapper.prepDeposit(ethWrapperAddress, depositAmount)
        await tl1.ethWrapper.confirm(rawTx)
        await wait()
        // prepare withdraw tx
        tx = await tl1.ethWrapper.prepWithdraw(ethWrapperAddress, withdrawAmount)
      })

      it('should confirm withdraw tx', async () => {
        expect(tl1.ethWrapper.confirm(tx.rawTx)).to.eventually.be.a('string')
        await wait()
        const [ ethBalanceAfter, wethBalanceAfter ] = await Promise.all([
          tl1.user.getBalance(),
          tl1.ethWrapper.getBalance(ethWrapperAddress)
        ])
        const deltaEth = Math.abs(new BigNumber(ethBalanceBefore.value)
          .minus(new BigNumber(ethBalanceAfter.value)).toNumber())
        const deltaWeth = Math.abs(new BigNumber(wethBalanceBefore.value)
          .minus(new BigNumber(wethBalanceAfter.value)).toNumber())
        expect(depositAmount - withdrawAmount).to.eq(deltaEth)
        expect(depositAmount - withdrawAmount).to.eq(deltaWeth)
      })
    })

    describe('#getLogs()', () => {
      let logs

      before(async () => {
        let tx = await tl1.ethWrapper.prepDeposit(ethWrapperAddress, depositAmount)
        await tl1.ethWrapper.confirm(tx.rawTx)
        await wait()
        tx = await tl1.ethWrapper.prepWithdraw(ethWrapperAddress, withdrawAmount)
        await tl1.ethWrapper.confirm(tx.rawTx)
        await wait()
        logs = await tl1.ethWrapper.getLogs(ethWrapperAddress)
      })

      it('should return all eth wrapper event logs', () => {
        expect(logs).to.be.an('array')
      })

      it('should return latest deposit log', async () => {
        const depositLogs = logs.filter(log => log.type === 'Deposit')
        const latestLog = depositLogs[depositLogs.length - 1]
        expect(latestLog.address).to.equal(tl1.user.address)
        expect(latestLog.amount).to.have.keys('decimals', 'raw', 'value')
        expect(latestLog.blockNumber).to.be.a('number')
        expect(latestLog.direction).to.equal('sent')
        expect(latestLog.tokenAddress).to.equal(ethWrapperAddress)
        expect(latestLog.status).to.be.a('string')
        expect(latestLog.timestamp).to.be.a('number')
        expect(latestLog.transactionId).to.be.a('string')
        expect(latestLog.type).to.equal('Deposit')
      })

      it('should return latest withdrawal log', async () => {
        const withdrawalLogs = logs.filter(log => log.type === 'Withdrawal')
        const latestLog = withdrawalLogs[withdrawalLogs.length - 1]
        expect(latestLog.address).to.equal(tl1.user.address)
        expect(latestLog.amount).to.have.keys('decimals', 'raw', 'value')
        expect(latestLog.blockNumber).to.be.a('number')
        expect(latestLog.direction).to.equal('sent')
        expect(latestLog.tokenAddress).to.equal(ethWrapperAddress)
        expect(latestLog.status).to.be.a('string')
        expect(latestLog.timestamp).to.be.a('number')
        expect(latestLog.transactionId).to.be.a('string')
        expect(latestLog.type).to.equal('Withdrawal')
      })
    })

    describe('#getBalance()', () => {
      before(async () => {
        const { rawTx } = await tl1.ethWrapper.prepDeposit(ethWrapperAddress, depositAmount)
        await tl1.ethWrapper.confirm(rawTx)
        await wait()
      })

      it('should return balance of wrapped eth', async () => {
        const balance = await tl1.ethWrapper.getBalance(ethWrapperAddress)
        expect(balance).to.have.keys('decimals', 'raw', 'value')
      })
    })
  })
})
