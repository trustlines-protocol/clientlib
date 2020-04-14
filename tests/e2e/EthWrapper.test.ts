import { BigNumber } from 'bignumber.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import {
  createAndLoadUsers,
  deployIdentities,
  parametrizedTLNetworkConfig,
  wait
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  parametrizedTLNetworkConfig.forEach(testParameter => {
    describe(`EthWrapper for wallet type: ${testParameter.walletType}`, () => {
      const { expect } = chai

      const config = testParameter.config

      const tl1 = new TLNetwork(config)
      const tl2 = new TLNetwork(config)
      const depositAmount = 0.002
      const withdrawAmount = 0.001
      const transferAmount = 0.0001
      let ethWrapperAddress

      before(async () => {
        // create users
        await createAndLoadUsers([tl1, tl2])
        await deployIdentities([tl1, tl2])
        // get eth wrapper address
        const addresses = await tl1.ethWrapper.getAddresses()
        ethWrapperAddress = addresses[0]
        // make sure users have eth
        await Promise.all([tl1.user.requestEth(), tl2.user.requestEth()])
        // wait for txs to be mined
        await wait()
      })

      describe('#getAddresses()', () => {
        it('should return array of wrapper addresses', async () => {
          await expect(tl1.ethWrapper.getAddresses()).to.eventually.be.an(
            'array'
          )
        })
      })

      describe('#prepDeposit()', () => {
        it('should prepare a deposit tx', async () => {
          await expect(
            tl1.ethWrapper.prepDeposit(ethWrapperAddress, depositAmount)
          ).to.eventually.have.keys('rawTx', 'txFees')
        })
      })

      describe('#confirm() - deposit', () => {
        let ethBalanceBefore
        let wethBalanceBefore
        let tx

        before(async () => {
          ;[ethBalanceBefore, wethBalanceBefore] = await Promise.all([
            tl1.user.getBalance(),
            tl1.ethWrapper.getBalance(ethWrapperAddress)
          ])
          tx = await tl1.ethWrapper.prepDeposit(
            ethWrapperAddress,
            depositAmount
          )
        })

        it('should confirm deposit tx', async () => {
          await expect(tl1.ethWrapper.confirm(tx.rawTx)).to.eventually.be.a(
            'string'
          )
          await wait()
          const [ethBalanceAfter, wethBalanceAfter] = await Promise.all([
            tl1.user.getBalance(),
            tl1.ethWrapper.getBalance(ethWrapperAddress)
          ])
          const deltaEth = Math.abs(
            new BigNumber(ethBalanceBefore.value)
              .minus(new BigNumber(ethBalanceAfter.value))
              .toNumber()
          )
          const deltaWeth = Math.abs(
            new BigNumber(wethBalanceBefore.value)
              .minus(new BigNumber(wethBalanceAfter.value))
              .toNumber()
          )
          expect(depositAmount).to.eq(deltaEth)
          expect(depositAmount).to.eq(deltaWeth)
        })
      })

      describe('#prepTransfer()', () => {
        it('should prepare transfer tx', async () => {
          await expect(
            tl1.ethWrapper.prepTransfer(
              ethWrapperAddress,
              tl2.user.address,
              transferAmount
            )
          ).to.eventually.have.keys('rawTx', 'txFees')
        })
      })

      describe('#confirm() - transfer', () => {
        // wrapped eth balance of user 1
        let wethBalanceBefore1
        // eth balance of user 2
        let ethBalanceBefore2
        let tx

        before(async () => {
          // make sure already deposited
          const { rawTx } = await tl1.ethWrapper.prepDeposit(
            ethWrapperAddress,
            depositAmount
          )
          await tl1.ethWrapper.confirm(rawTx)
          await wait()
          // set balances before transfer
          const balances = await Promise.all([
            tl1.ethWrapper.getBalance(ethWrapperAddress),
            tl2.user.getBalance()
          ])
          wethBalanceBefore1 = balances[0]
          ethBalanceBefore2 = balances[1]
          // prepare withdraw tx
          tx = await tl1.ethWrapper.prepTransfer(
            ethWrapperAddress,
            tl2.user.address,
            transferAmount
          )
        })

        it('should confirm transfer tx', async () => {
          await expect(tl1.ethWrapper.confirm(tx.rawTx)).to.eventually.be.a(
            'string'
          )
          await wait()
          const [wethBalanceAfter1, ethBalanceAfter2] = await Promise.all([
            tl1.ethWrapper.getBalance(ethWrapperAddress),
            tl2.user.getBalance()
          ])
          const deltaWeth1 = Math.abs(
            new BigNumber(wethBalanceBefore1.value)
              .minus(new BigNumber(wethBalanceAfter1.value))
              .toNumber()
          )
          const deltaEth2 = Math.abs(
            new BigNumber(ethBalanceBefore2.value)
              .minus(new BigNumber(ethBalanceAfter2.value))
              .toNumber()
          )
          expect(deltaWeth1).to.eq(transferAmount)
          expect(deltaEth2).to.eq(transferAmount)
        })
      })

      describe('#prepWithdraw()', () => {
        it('should prepare withdraw tx', async () => {
          await expect(
            tl1.ethWrapper.prepWithdraw(ethWrapperAddress, withdrawAmount)
          ).to.eventually.have.keys('rawTx', 'txFees')
        })
      })

      describe('#confirm() - withdraw', () => {
        let ethBalanceBefore
        let wethBalanceBefore
        let tx

        before(async () => {
          // set balances before withdraw
          ;[ethBalanceBefore, wethBalanceBefore] = await Promise.all([
            tl1.user.getBalance(),
            tl1.ethWrapper.getBalance(ethWrapperAddress)
          ])
          // make sure already deposited
          const { rawTx } = await tl1.ethWrapper.prepDeposit(
            ethWrapperAddress,
            depositAmount
          )
          await tl1.ethWrapper.confirm(rawTx)
          await wait()
          // prepare withdraw tx
          tx = await tl1.ethWrapper.prepWithdraw(
            ethWrapperAddress,
            withdrawAmount
          )
        })

        it('should confirm withdraw tx', async () => {
          await expect(tl1.ethWrapper.confirm(tx.rawTx)).to.eventually.be.a(
            'string'
          )
          await wait()
          const [ethBalanceAfter, wethBalanceAfter] = await Promise.all([
            tl1.user.getBalance(),
            tl1.ethWrapper.getBalance(ethWrapperAddress)
          ])
          const deltaEth = Math.abs(
            new BigNumber(ethBalanceBefore.value)
              .minus(new BigNumber(ethBalanceAfter.value))
              .toNumber()
          )
          const deltaWeth = Math.abs(
            new BigNumber(wethBalanceBefore.value)
              .minus(new BigNumber(wethBalanceAfter.value))
              .toNumber()
          )
          expect(depositAmount - withdrawAmount).to.eq(deltaEth)
          expect(depositAmount - withdrawAmount).to.eq(deltaWeth)
        })
      })

      describe('#getLogs()', () => {
        let logs

        before(async () => {
          let tx = await tl1.ethWrapper.prepDeposit(
            ethWrapperAddress,
            depositAmount
          )
          await tl1.ethWrapper.confirm(tx.rawTx)
          await wait()
          tx = await tl1.ethWrapper.prepWithdraw(
            ethWrapperAddress,
            withdrawAmount
          )
          await tl1.ethWrapper.confirm(tx.rawTx)
          await wait()
          tx = await tl1.ethWrapper.prepTransfer(
            ethWrapperAddress,
            tl2.user.address,
            transferAmount
          )
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
          expect(latestLog.counterParty).to.equal(tl1.user.address)
          expect(latestLog.user).to.equal(tl1.user.address)
          expect(latestLog.amount).to.have.keys('decimals', 'raw', 'value')
          expect(latestLog.blockNumber).to.be.a('number')
          expect(latestLog.direction).to.equal('sent')
          expect(latestLog.tokenAddress).to.equal(ethWrapperAddress)
          expect(latestLog.status).to.be.a('string')
          expect(latestLog.timestamp).to.be.a('number')
          expect(latestLog.transactionHash).to.be.a('string')
          expect(latestLog.type).to.equal('Deposit')
        })

        it('should return latest withdrawal log', async () => {
          const withdrawalLogs = logs.filter(log => log.type === 'Withdrawal')
          const latestLog = withdrawalLogs[withdrawalLogs.length - 1]
          expect(latestLog.counterParty).to.equal(tl1.user.address)
          expect(latestLog.user).to.equal(tl1.user.address)
          expect(latestLog.amount).to.have.keys('decimals', 'raw', 'value')
          expect(latestLog.blockNumber).to.be.a('number')
          expect(latestLog.direction).to.equal('sent')
          expect(latestLog.tokenAddress).to.equal(ethWrapperAddress)
          expect(latestLog.status).to.be.a('string')
          expect(latestLog.timestamp).to.be.a('number')
          expect(latestLog.transactionHash).to.be.a('string')
          expect(latestLog.type).to.equal('Withdrawal')
        })

        it('should return latest transfer log', async () => {
          const transferLogs = logs.filter(log => log.type === 'Transfer')
          const latestLog = transferLogs[transferLogs.length - 1]
          expect(latestLog.amount).to.have.keys('decimals', 'raw', 'value')
          expect(latestLog.blockNumber).to.be.a('number')
          expect(latestLog.direction).to.equal('sent')
          expect(latestLog.from).to.equal(tl1.user.address)
          expect(latestLog.tokenAddress).to.equal(ethWrapperAddress)
          expect(latestLog.status).to.be.a('string')
          expect(latestLog.timestamp).to.be.a('number')
          expect(latestLog.to).to.equal(tl2.user.address)
          expect(latestLog.counterParty).to.equal(tl2.user.address)
          expect(latestLog.user).to.equal(tl1.user.address)
          expect(latestLog.transactionHash).to.be.a('string')
          expect(latestLog.type).to.equal('Transfer')
        })
      })

      describe('#getBalance()', () => {
        before(async () => {
          const { rawTx } = await tl1.ethWrapper.prepDeposit(
            ethWrapperAddress,
            depositAmount
          )
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
})
