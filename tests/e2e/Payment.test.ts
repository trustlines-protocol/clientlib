import { BigNumber } from 'bignumber.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { AddressZero } from 'ethers/constants'
import { TLNetwork } from '../../src/TLNetwork'
import { FeePayer, PathRaw, TLWalletData } from '../../src/typings'
import utils, { checkAddress } from '../../src/utils'
import {
  createAndLoadUsers,
  deployIdentities,
  extraData,
  parametrizedTLNetworkConfig,
  paymentRequestId,
  requestEth,
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
      const tl3 = new TLNetwork(config)
      let user1
      let user2
      let user3
      let network

      before(async () => {
        ;[network] = await tl1.currencyNetwork.getAll()
        // create new users
        ;[user1, user2, user3] = await createAndLoadUsers([tl1, tl2, tl3])
        await deployIdentities([tl1, tl2, tl3])
        // request ETH
        await requestEth([tl1, tl2, tl3])
        await wait()

        const trustlines = [[tl1, tl2], [tl2, tl3]]
        // Establish all trustlines
        for (const trustline of trustlines) {
          // Get the both users for this trustline.
          const [a, b] = trustline

          // Prepare trustline update transaction from a to b.
          const { rawTx: rawUpdateTx } = await a.trustline.prepareUpdate(
            network.address,
            b.user.address,
            1000,
            1000,
            {
              interestRateGiven: 1,
              interestRateReceived: 1
            }
          )

          // Prepare trustline accept transaction from b to a.
          const { rawTx: rawAcceptTx } = await b.trustline.prepareAccept(
            network.address,
            a.user.address,
            1000,
            1000,
            {
              interestRateGiven: 1,
              interestRateReceived: 1
            }
          )

          // Sign and relay prepared transactions.
          a.trustline.confirm(rawUpdateTx)
          b.trustline.confirm(rawAcceptTx)
          // wait for txs to be mined
          await wait()
        }
      })

      describe('#getTransferPathInfo()', () => {
        it('should return sender pays path', async () => {
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

        it('should return receiver pays path', async () => {
          const options = { feePayer: FeePayer.Receiver }
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
            2000
          )
          expect(pathObj.maxFees).to.have.keys('decimals', 'raw', 'value')
          expect(pathObj.maxFees.raw).to.equal('0')
          expect(pathObj.path).to.deep.equal([])
        })

        it('should return path using extra data', async () => {
          const options = {
            feePayer: FeePayer.Sender,
            extraData,
            addMessageId: false
          }
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
            2.25
          )
          expect(preparedPayment).to.have.all.keys(
            'rawTx',
            'feePayer',
            'txFees',
            'maxFees',
            'path',
            'receiverAddress',
            'messageId'
          )
          expect(preparedPayment.feePayer).to.equal(FeePayer.Sender)
        })

        it('should prepare tx for trustline transfer with extraData', async () => {
          const preparedPayment = await tl1.payment.prepare(
            network.address,
            user2.address,
            2.25,
            {
              extraData,
              addMessageId: false
            }
          )
          expect(preparedPayment).to.have.all.keys(
            'rawTx',
            'feePayer',
            'txFees',
            'maxFees',
            'path',
            'receiverAddress',
            'messageId'
          )
          expect(preparedPayment.feePayer).to.equal(FeePayer.Sender)
        })

        it('should prepare tx for trustline transferReceiverPays', async () => {
          const options = { feePayer: FeePayer.Receiver }

          const preparedPayment = await tl1.payment.prepare(
            network.address,
            user2.address,
            2.25,
            options
          )
          expect(preparedPayment).to.have.all.keys(
            'rawTx',
            'feePayer',
            'txFees',
            'maxFees',
            'path',
            'receiverAddress',
            'messageId'
          )
          expect(preparedPayment.feePayer).to.equal(FeePayer.Receiver)
        })

        it('should prepare tx for trustline with payment request id', async () => {
          const preparedPayment = await tl1.payment.prepare(
            network.address,
            user2.address,
            2.25,
            {
              paymentRequestId
            }
          )

          expect(preparedPayment).to.have.all.keys(
            'rawTx',
            'feePayer',
            'txFees',
            'maxFees',
            'path',
            'receiverAddress',
            'messageId'
          )
          expect(preparedPayment.feePayer).to.equal(FeePayer.Sender)
        })

        it('should not prepare tx for trustline transfer', async () => {
          await expect(
            tl1.payment.prepare(network.address, user2.address, 2000)
          ).to.be.rejectedWith('Could not find a path with enough capacity')
        })

        if (testParameter.walletType === 'Identity') {
          it('should have correct delegation fees for trustline transfer', async () => {
            const preparedPayment = await tl1.payment.prepare(
              network.address,
              user2.address,
              2.25
            )

            const expectedGasLimit = tl1.payment.calculateTransferGasLimit(2)

            expect(preparedPayment.txFees).to.have.all.keys(
              'gasPrice',
              'gasLimit',
              'baseFee',
              'totalFee',
              'feeRecipient',
              'currencyNetworkOfFees'
            )
            expect(preparedPayment.txFees.feeRecipient).to.not.equal(
              AddressZero
            )
            expect(preparedPayment.txFees.currencyNetworkOfFees).to.satisfy(
              currencyNetworkOfFees =>
                currencyNetworkOfFees === null ||
                checkAddress(currencyNetworkOfFees)
            )

            expect(preparedPayment.txFees.currencyNetworkOfFees).to.not.equal(
              AddressZero
            )

            expect(preparedPayment.txFees.baseFee).to.have.keys(
              'decimals',
              'raw',
              'value'
            )
            expect(preparedPayment.txFees.gasPrice).to.have.keys(
              'decimals',
              'raw',
              'value'
            )
            expect(preparedPayment.txFees.gasLimit.raw).to.equal(
              expectedGasLimit.toString()
            )
          })
        } else {
          it('should have correct txFees for trustline transfer', async () => {
            const preparedPayment = await tl1.payment.prepare(
              network.address,
              user2.address,
              2.25
            )

            const expectedGasLimit = tl1.payment.calculateTransferGasLimit(2)

            expect(preparedPayment).to.not.have.keys(
              'feeRecipient',
              'currencyNetworkOfFees'
            )
            expect(preparedPayment.txFees.gasPrice.raw).to.equal('0')
            expect(preparedPayment.txFees.totalFee.raw).to.equal('0')
            expect(preparedPayment.txFees.totalFee.value).to.equal('0')
            expect(preparedPayment.txFees.totalFee.decimals).to.equal(18)
            expect(preparedPayment.txFees.baseFee.raw).to.equal('0')
            expect(preparedPayment.txFees.gasLimit.raw).to.equal(
              expectedGasLimit.toString()
            )
          })
        }
      })

      describe('#confirm()', () => {
        it('should confirm trustline transfer', async () => {
          const { rawTx } = await tl1.payment.prepare(
            network.address,
            user2.address,
            1
          )
          const txHash = await tl1.payment.confirm(rawTx)
          await wait()
          expect(txHash).to.be.a('string')
          expect(
            (await tl1.trustline.get(network.address, user2.address)).balance
              .value
          ).to.equal('-1')
        })

        it('should confirm trustline transfer with extraData', async () => {
          const { rawTx } = await tl1.payment.prepare(
            network.address,
            user2.address,
            1,
            {
              extraData,
              addMessageId: false
            }
          )
          const txHash = await tl1.payment.confirm(rawTx)
          await wait()
          expect(txHash).to.be.a('string')
        })

        it('should confirm trustline transferReceiverPays', async () => {
          const options = { feePayer: FeePayer.Receiver }
          const { rawTx } = await tl1.payment.prepare(
            network.address,
            user2.address,
            1,
            options
          )
          const txHash = await tl1.payment.confirm(rawTx)
          await wait()
          expect(txHash).to.be.a('string')
        })

        describe('confirm with message', () => {
          const messages = []
          let stream
          let messageId: string
          const paymentMessage = 'test message'

          before(async () => {
            // subscribe tl2 to receive payment message
            stream = tl2.messaging
              .messageStream()
              .subscribe(message => messages.push(message))
            await wait()
          })

          it('should confirm trustline transfer with message', async () => {
            const preparedPayment = await tl1.payment.prepare(
              network.address,
              user2.address,
              1
            )
            messageId = preparedPayment.messageId
            const txHash = await tl1.payment.confirmPayment(
              preparedPayment,
              paymentMessage
            )
            await wait()
            expect(txHash).to.be.a('string')
          })

          it('should receive message sent via confirm', async () => {
            // We expect to have messages for `WebsocketOpen` and then the payment message
            expect(messages).to.have.lengthOf(2)
            expect(messages[1]).to.have.property('type', 'PaymentMessage')
            expect(messages[1]).to.have.property('messageId', messageId)
            expect(messages[1]).to.have.property('subject', paymentMessage)
          })

          after(() => {
            stream.unsubscribe()
          })
        })
      })

      describe('#get()', () => {
        let messageId: string

        before(async () => {
          const preparedPayment = await tl1.payment.prepare(
            network.address,
            user2.address,
            1.5,
            {
              paymentRequestId,
              addMessageId: true
            }
          )
          messageId = preparedPayment.messageId
          await tl1.payment.confirm(preparedPayment.rawTx)
          await wait()
        })

        it('should return transfers array', async () => {
          await expect(tl1.payment.get(network.address)).to.eventually.be.an(
            'array'
          )
        })

        it('should return latest transfer', async () => {
          const transfers = await tl1.payment.get(network.address)
          const latestTransfer = transfers[transfers.length - 1]
          expect(latestTransfer.user).to.be.equal(tl1.user.address)
          expect(latestTransfer.counterParty).to.be.equal(tl2.user.address)
          expect(latestTransfer.amount).to.have.keys('decimals', 'raw', 'value')
          expect(latestTransfer.amount.value).to.equal('1.5')
          expect(latestTransfer.extraData).to.be.a('string')
          expect(latestTransfer.paymentRequestId).to.equal(paymentRequestId)
          expect(latestTransfer.messageId).to.equal(messageId)
          expect(latestTransfer.blockNumber).to.be.a('number')
          expect(latestTransfer.direction).to.equal('sent')
          expect(latestTransfer.networkAddress).to.be.a('string')
          expect(latestTransfer.status).to.be.a('string')
          expect(latestTransfer.timestamp).to.be.a('number')
          expect(latestTransfer.transactionHash).to.be.a('string')
          expect(latestTransfer.type).to.equal('Transfer')
        })
      })

      describe('#getTransferDetails()', () => {
        it('should return details for transfer via transaction hash', async () => {
          // make a transfer
          const transferValue = 123
          const transfer = await tl1.payment.prepare(
            network.address,
            user3.address,
            transferValue,
            {
              extraData,
              addMessageId: false
            }
          )
          const txHash = await tl1.payment.confirm(transfer.rawTx)
          await wait()

          const transferDetailsList = await tl1.payment.getTransferDetailsList({
            txHash
          })
          expect(transferDetailsList).to.be.an('array')
          expect(transferDetailsList.length).to.equal(1)
          const transferDetails = transferDetailsList[0]
          expect(transferDetails).to.have.all.keys(
            'path',
            'currencyNetwork',
            'value',
            'feePayer',
            'totalFees',
            'feesPaid',
            'extraData'
          )
          expect(transferDetails.path).to.be.an('Array')
          expect(transferDetails.path).to.deep.equal([
            user1.address,
            user2.address,
            user3.address
          ])
          expect(transferDetails.currencyNetwork).to.equal(network.address)
          expect(transferDetails.value).to.have.keys('raw', 'value', 'decimals')
          expect(transferDetails.value.value).to.equal(transferValue.toString())
          expect(transferDetails.feePayer).to.equal(FeePayer.Sender)
          expect(transferDetails.totalFees).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(transferDetails.feesPaid).to.be.an('Array')
          expect(transferDetails.feesPaid.length).to.equal(1)
          expect(transferDetails.feesPaid[0]).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(transferDetails.feesPaid[0].value).to.equal(
            transferDetails.totalFees.value
          )
          expect(transferDetails.extraData).to.equal(extraData)
        })

        it('should return details for transfer via id', async () => {
          // make a transfer
          const transferValue = 123
          const transfer = await tl1.payment.prepare(
            network.address,
            user3.address,
            transferValue,
            {
              extraData,
              addMessageId: false
            }
          )
          await tl1.payment.confirm(transfer.rawTx)
          await wait()

          const transferLogs = await tl1.payment.get(network.address)
          const lastTransferLog = transferLogs[transferLogs.length - 1]

          const transferDetails = await tl1.payment.getTransferDetails({
            blockHash: lastTransferLog.blockHash,
            logIndex: lastTransferLog.logIndex
          })

          expect(transferDetails).to.have.all.keys(
            'path',
            'currencyNetwork',
            'value',
            'feePayer',
            'totalFees',
            'feesPaid',
            'extraData'
          )
          expect(transferDetails.path).to.be.an('Array')
          expect(transferDetails.path).to.deep.equal([
            user1.address,
            user2.address,
            user3.address
          ])
          expect(transferDetails.currencyNetwork).to.equal(network.address)
          expect(transferDetails.value).to.have.keys('raw', 'value', 'decimals')
          expect(transferDetails.value.value).to.equal(transferValue.toString())
          expect(transferDetails.feePayer).to.equal(FeePayer.Sender)
          expect(transferDetails.totalFees).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(transferDetails.feesPaid).to.be.an('Array')
          expect(transferDetails.feesPaid.length).to.equal(1)
          expect(transferDetails.feesPaid[0]).to.have.keys(
            'raw',
            'value',
            'decimals'
          )
          expect(transferDetails.feesPaid[0].value).to.equal(
            transferDetails.totalFees.value
          )
          expect(transferDetails.extraData).to.equal('0x12ab34ef')
        })
      })

      describe('#prepareEth()', () => {
        it('should prepare tx for eth transfer', async () => {
          await expect(
            tl1.payment.prepareEth(user2.address, 0.05)
          ).to.eventually.have.keys('rawTx', 'txFees')
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
          expect(delta.toNumber()).to.equal(0.0001)
        })
      })

      describe('Maximum spendable amount', () => {
        describe('#getMaxAmountAndPathInNetwork()', () => {
          it('should return the path and the amount for adjacent users', async () => {
            const result = await tl1.payment.getMaxAmountAndPathInNetwork(
              network.address,
              user2.address
            )
            expect(result.path.length).to.equal(2)
            expect(result.amount).to.have.keys('decimals', 'raw', 'value')
          })

          it('should return the path and the amount for non-adjacent users', async () => {
            const result = await tl1.payment.getMaxAmountAndPathInNetwork(
              network.address,
              tl3.user.address
            )
            expect(result.path.length).to.equal(3)
            expect(result.amount).to.have.keys('decimals', 'raw', 'value')
          })
        })
      })
    })
  })
})
