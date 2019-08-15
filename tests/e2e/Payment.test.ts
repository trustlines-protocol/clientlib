import { BigNumber } from 'bignumber.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import { FeePayer, PathRaw } from '../../src/typings'
import {
  createUsers,
  extraData,
  parametrizedTLNetworkConfig,
  wait
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  parametrizedTLNetworkConfig.forEach(testParameter => {
    describe(`Payment for wallet type: ${testParameter.walletType}`, () => {
      const { expect } = chai

      const config = testParameter.config

      const tl1 = new TLNetwork(config)
      const tl2 = new TLNetwork(config)
      let user1
      let user2
      let network

      before(async () => {
        // set network and load users
        ;[[network], [user1, user2]] = await Promise.all([
          tl1.currencyNetwork.getAll(),
          createUsers([tl1, tl2])
        ])
        // make sure users have eth
        await Promise.all([tl1.user.requestEth(), tl2.user.requestEth()])
        // wait for tx to be mined
        await wait()
        // set up trustlines
        const [tx1, tx2] = await Promise.all([
          tl1.trustline.prepareUpdate(
            network.address,
            user2.address,
            1000,
            500
          ),
          tl2.trustline.prepareUpdate(network.address, user1.address, 500, 1000)
        ])
        await Promise.all([
          tl1.trustline.confirm(tx1.rawTx),
          tl2.trustline.confirm(tx2.rawTx)
        ])
        // wait for tx to be mined
        await wait()
      })

      describe('#getTransferPathInfo()', () => {
        it('should return sender pays path', async () => {
          const options = { feePayer: FeePayer.Sender, extraData }
          const pathObj = await tl1.payment.getTransferPathInfo(
            network.address,
            user1.address,
            user2.address,
            1.5,
            options
          )
          expect(pathObj.maxFees).to.have.keys('decimals', 'raw', 'value')
          expect(pathObj.path).to.not.equal([])
          expect(pathObj.feePayer).to.equal(FeePayer.Sender)
        })

        it('should return receiver pays path', async () => {
          const options = { feePayer: FeePayer.Receiver, extraData }
          const pathObj = await tl1.payment.getTransferPathInfo(
            network.address,
            user1.address,
            user2.address,
            1.5,
            options
          )
          expect(pathObj.maxFees).to.have.keys('decimals', 'raw', 'value')
          expect(pathObj.path).to.not.equal([])
          expect(pathObj.feePayer).to.equal(FeePayer.Receiver)
        })

        it('should return no path', async () => {
          const pathObj = await tl1.payment.getTransferPathInfo(
            network.address,
            user1.address,
            user2.address,
            1000
          )
          expect(pathObj.maxFees).to.have.keys('decimals', 'raw', 'value')
          expect(pathObj.maxFees.raw).to.equal('0')
          expect(pathObj.path).to.deep.equal([])
        })

        it('should return path using no extra data', async () => {
          const options = { feePayer: FeePayer.Sender }
          const pathObj = await tl1.payment.getTransferPathInfo(
            network.address,
            user1.address,
            user2.address,
            1.5,
            options
          )
          expect(pathObj.maxFees).to.have.keys('decimals', 'raw', 'value')
          expect(pathObj.path).to.not.equal([])
          expect(pathObj.feePayer).to.equal(FeePayer.Sender)
        })
      })

      describe('#prepare()', () => {
        it('should prepare tx for trustline transfer', async () => {
          const preparedPayment = await tl1.payment.prepare(
            network.address,
            user2.address,
            2.25,
            { extraData }
          )
          expect(preparedPayment).to.have.all.keys(
            'rawTx',
            'feePayer',
            'ethFees',
            'maxFees',
            'path'
          )
          expect(preparedPayment.feePayer).to.equal(FeePayer.Sender)
        })

        it('should prepare tx for trustline transfer without extraData', async () => {
          const preparedPayment = await tl1.payment.prepare(
            network.address,
            user2.address,
            2.25
          )
          expect(preparedPayment).to.have.all.keys(
            'rawTx',
            'feePayer',
            'ethFees',
            'maxFees',
            'path'
          )
          expect(preparedPayment.feePayer).to.equal(FeePayer.Sender)
        })

        it('should prepare tx for trustline transferReceiverPays', async () => {
          const options = { feePayer: FeePayer.Receiver, extraData }

          const preparedPayment = await tl1.payment.prepare(
            network.address,
            user2.address,
            2.25,
            options
          )
          expect(preparedPayment).to.have.all.keys(
            'rawTx',
            'feePayer',
            'ethFees',
            'maxFees',
            'path'
          )
          expect(preparedPayment.feePayer).to.equal(FeePayer.Receiver)
        })

        it('should not prepare tx for trustline transfer', async () => {
          await expect(
            tl1.payment.prepare(network.address, user2.address, 2000)
          ).to.be.rejectedWith('Could not find a path with enough capacity')
        })
      })

      describe('#confirm()', () => {
        it('should confirm trustline transfer', async () => {
          const { rawTx } = await tl1.payment.prepare(
            network.address,
            user2.address,
            1,
            { extraData }
          )
          const txId = await tl1.payment.confirm(rawTx)
          await wait()
          expect(txId).to.be.a('string')
          expect(
            (await tl1.trustline.get(network.address, user2.address)).balance
              .value
          ).to.equal('-1')
        })

        it('should confirm trustline transferReceiverPays', async () => {
          const options = { feePayer: FeePayer.Receiver, extraData }
          const { rawTx } = await tl1.payment.prepare(
            network.address,
            user2.address,
            1,
            options
          )
          const txId = await tl1.payment.confirm(rawTx)
          await wait()
          expect(txId).to.be.a('string')
        })
      })

      describe('#get()', () => {
        before(async () => {
          const { rawTx } = await tl1.payment.prepare(
            network.address,
            user2.address,
            1.5,
            { extraData }
          )
          await tl1.payment.confirm(rawTx)
          await wait()
        })

        it('should return transfers array', () => {
          expect(tl1.payment.get(network.address)).to.eventually.be.an('array')
        })

        it('should return latest transfer', async () => {
          const transfers = await tl1.payment.get(network.address)
          const latestTransfer = transfers[transfers.length - 1]
          expect(latestTransfer.user).to.be.equal(tl1.user.address)
          expect(latestTransfer.counterParty).to.be.equal(tl2.user.address)
          expect(latestTransfer.amount).to.have.keys('decimals', 'raw', 'value')
          expect(latestTransfer.amount.value).to.eq('1.5')
          expect(latestTransfer.extraData).to.eq(extraData)
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
          expect(
            tl1.payment.prepareEth(user2.address, 0.05)
          ).to.eventually.have.keys('rawTx', 'ethFees')
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
          await wait()
          const afterBalance = await tl2.user.getBalance()
          const delta = new BigNumber(afterBalance.value).minus(
            beforeBalance.value
          )
          expect(delta.toNumber()).to.eq(0.0001)
        })
      })

      describe('Maximum spendable amount', () => {
        const tl3 = new TLNetwork(config)
        let user3

        before(async () => {
          user3 = await tl3.user.create()
          // make sure users have eth
          await tl3.user.requestEth()
          // set up trustlines
          const [tx1, tx2] = await Promise.all([
            tl2.trustline.prepareUpdate(
              network.address,
              user3.address,
              300,
              200
            ),
            tl3.trustline.prepareUpdate(
              network.address,
              user2.address,
              200,
              300
            )
          ])

          await Promise.all([
            tl2.trustline.confirm(tx1.rawTx),
            tl3.trustline.confirm(tx2.rawTx)
          ])
          // wait for tx to be mined
          await wait()
        })

        describe('#getMaxAmountAndPathInNetwork()', () => {
          it('should return the path and the amount for adjacent users', async () => {
            const result = await tl1.payment.getMaxAmountAndPathInNetwork(
              network.address,
              user2.address
            )
            expect(result.path.length).to.eq(2)
            expect(result.amount).to.have.keys('decimals', 'raw', 'value')
          })

          it('should return the path and the amount for non-adjacent users', async () => {
            const result = await tl1.payment.getMaxAmountAndPathInNetwork(
              network.address,
              user3.address
            )
            expect(result.path.length).to.eq(3)
            expect(result.amount).to.have.keys('decimals', 'raw', 'value')
          })
        })
      })
    })
  })
})
