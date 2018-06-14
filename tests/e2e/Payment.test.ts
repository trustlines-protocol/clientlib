import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { BigNumber } from 'bignumber.js'

import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, keystore2, wait } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Payment', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let network

    before(async () => {
      // set network and load users
      [ [ network ], user1, user2 ] = await Promise.all([
        tl1.currencyNetwork.getAll(),
        tl1.user.load(keystore1),
        tl2.user.load(keystore2)
      ])
      // make sure users have eth
      await Promise.all([tl1.user.requestEth(), tl2.user.requestEth()])
      // set up trustlines
      const [ tx1, tx2 ] = await Promise.all([
        tl1.trustline.prepareUpdate(network.address, user2.address, 1000, 500),
        tl2.trustline.prepareUpdate(network.address, user1.address, 500, 1000)
      ])
      await Promise.all([
        tl1.trustline.confirm(tx1.rawTx),
        tl2.trustline.confirm(tx2.rawTx)
      ])
      // wait for tx to be mined
      await wait(1000)
    })

    describe('#getPath()', () => {
      it('should return path', async () => {
        const pathObj = await tl1.payment.getPath(network.address, user1.address, user2.address, 1.5)
        expect(pathObj.estimatedGas).to.not.equal(0)
        expect(pathObj.maxFees).to.have.keys('decimals', 'raw', 'value')
        expect(pathObj.maxFees.raw).to.not.equal('0')
        expect(pathObj.path).to.not.equal([])
      })

      it('should return no path', async () => {
        const pathObj = await tl1.payment.getPath(network.address, user1.address, user2.address, 1000)
        expect(pathObj.estimatedGas).to.equal(0)
        expect(pathObj.maxFees).to.have.keys('decimals', 'raw', 'value')
        expect(pathObj.maxFees.raw).to.equal('0')
        expect(pathObj.path).to.deep.equal([])
      })
    })

    describe('#prepare()', () => {
      it('should prepare tx for trustline transfer', () => {
        expect(tl1.payment.prepare(network.address, user2.address, 2.25))
          .to.eventually.have.keys('rawTx', 'ethFees', 'maxFees', 'path')
      })

      it('should not prepare tx for trustline transfer', async () => {
        await expect(tl1.payment.prepare(network.address, user2.address, 2000))
          .to.be.rejectedWith('Could not find a path with enough capacity')
      })
    })

    describe('#confirm()', () => {
      it('should confirm trustline transfer', async () => {
        const { rawTx } = await tl1.payment.prepare(network.address, user2.address, 1)
        expect(tl1.payment.confirm(rawTx)).to.eventually.be.a('string')
      })
    })

    describe('#get()', () => {
      before(async () => {
        const { rawTx } = await tl1.payment.prepare(network.address, user2.address, 1.5)
        await tl1.payment.confirm(rawTx)
        await wait(1000)
      })

      it('should return transfers array', () => {
        expect(tl1.payment.get(network.address))
          .to.eventually.be.an('array')
      })

      it('should return latest transfer', async () => {
        const transfers = await tl1.payment.get(network.address)
        const latestTransfer = transfers[transfers.length - 1]
        expect(latestTransfer.address).to.be.a('string')
        expect(latestTransfer.amount).to.have.keys('decimals', 'raw', 'value')
        expect(latestTransfer.amount.value).to.eq('1.5')
        expect(latestTransfer.blockNumber).to.be.a('number')
        expect(latestTransfer.direction).to.equal('sent')
        expect(latestTransfer.networkAddress).to.be.a('string')
        expect(latestTransfer.status).to.be.a('string')
        expect(latestTransfer.timestamp).to.be.a('number')
        expect(latestTransfer.transactionId).to.be.a('string')
        expect(latestTransfer.type).to.equal('Transfer')
      })
    })

    describe('#prepareEth()', () => {
      it('should prepare tx for eth transfer', () => {
        expect(tl1.payment.prepareEth(user2.address, 0.05))
          .to.eventually.have.keys('rawTx', 'ethFees')
      })
    })

    describe('#confirm()', () => {
      let beforeBalance

      before(async () => {
        beforeBalance = await tl2.user.getBalance()
      })

      it('should confirm eth transfer', async () => {
        const { rawTx } = await tl1.payment.prepareEth(user2.address, 0.0001)
        await tl1.payment.confirm(rawTx)
        await wait(1000)
        const afterBalance = await tl2.user.getBalance()
        const delta = new BigNumber(afterBalance.value).minus(beforeBalance.value)
        expect(delta.toNumber()).to.eq(0.0001)
      })
    })
  })
})
