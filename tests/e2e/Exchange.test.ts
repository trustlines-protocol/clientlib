import { BigNumber } from 'bignumber.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import { NetworkDetails } from '../../src/typings'
import {
  createAndLoadUsers,
  deployIdentities,
  tlNetworkConfig,
  wait
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe(`Exchange`, () => {
    const { expect } = chai

    const tl1 = new TLNetwork(tlNetworkConfig)
    const tl2 = new TLNetwork(tlNetworkConfig)

    let user1
    let user2
    let networks
    let exchangeAddress
    let makerTokenAddress
    let makerTokenDecimals
    let takerTokenAddress
    let takerTokenDecimals
    let unwEthAddress
    let latestOrder

    before(async () => {
      // load users, set exchange address and maker, taker tokens
      ;[
        [user1, user2],
        [exchangeAddress],
        networks,
        [unwEthAddress]
      ] = await Promise.all([
        createAndLoadUsers([tl1, tl2]),
        tl1.exchange.getExAddresses(),
        tl1.currencyNetwork.getAll(),
        tl1.ethWrapper.getAddresses()
      ])
      await deployIdentities([tl1, tl2])
      const networksWithInfo = await Promise.all(
        networks.map(network => tl1.currencyNetwork.getInfo(network.address))
      )
      const [makerToken, takerToken] = networksWithInfo.filter(
        n => (n as NetworkDetails).decimals === 4
      )
      makerTokenAddress = (makerToken as NetworkDetails).address
      makerTokenDecimals = (makerToken as NetworkDetails).decimals
      takerTokenAddress = (takerToken as NetworkDetails).address
      takerTokenDecimals = (takerToken as NetworkDetails).decimals
      // make sure users have eth
      await Promise.all([tl1.user.requestEth(), tl2.user.requestEth()])
      await wait()
      const [tx1, tx2] = await Promise.all([
        // set trustlines in maker token
        tl1.trustline.prepareUpdate(makerTokenAddress, user2.address, 100, 200),
        tl2.trustline.prepareAccept(makerTokenAddress, user1.address, 200, 100)
      ])
      await Promise.all([
        tl1.trustline.confirm(tx1.rawTx),
        tl2.trustline.confirm(tx2.rawTx)
      ])
      await wait()
      const [tx3, tx4] = await Promise.all([
        // set trustlines in taker token
        tl1.trustline.prepareUpdate(takerTokenAddress, user2.address, 300, 400),
        tl2.trustline.prepareAccept(takerTokenAddress, user1.address, 400, 300)
      ])
      await Promise.all([
        tl1.trustline.confirm(tx3.rawTx),
        tl2.trustline.confirm(tx4.rawTx)
      ])
      await wait()
    })

    describe('#getExAddresses()', () => {
      it('should return array', async () => {
        await expect(tl1.exchange.getExAddresses()).to.eventually.be.an('array')
      })
    })

    describe('#getOrderbook()', () => {
      it('should return orderbook', async () => {
        await expect(
          tl1.exchange.getOrderbook(makerTokenAddress, takerTokenAddress)
        ).to.eventually.have.keys('asks', 'bids')
      })
    })

    describe('#makeOrder()', () => {
      it('should make order', async () => {
        const makerTokenValue = 1000
        const takerTokenValue = 2000
        const order = await tl1.exchange.makeOrder(
          exchangeAddress,
          makerTokenAddress,
          takerTokenAddress,
          makerTokenValue,
          takerTokenValue
        )
        expect(order.exchangeContractAddress).to.equal(exchangeAddress)
        expect(order.maker).to.equal(tl1.user.address)
        expect(order.makerTokenAddress).to.equal(makerTokenAddress)
        expect(order.takerTokenAddress).to.equal(takerTokenAddress)
        expect(order.makerTokenAmount).to.have.keys('raw', 'value', 'decimals')
        expect(order.makerTokenAmount.value).to.equal(
          new BigNumber(makerTokenValue).toString()
        )
        expect(order.makerTokenAmount.decimals).to.equal(makerTokenDecimals)
        expect(order.takerTokenAmount).to.have.keys('raw', 'value', 'decimals')
        expect(order.takerTokenAmount.value).to.equal(
          new BigNumber(takerTokenValue).toString()
        )
        expect(order.takerTokenAmount.decimals).to.equal(takerTokenDecimals)
        expect(order.salt).to.be.a('string')
        expect(order.expirationUnixTimestampSec).to.be.a('string')
        expect(order.ecSignature).to.have.keys('r', 's', 'v')
      })
    })

    describe('#getOrderByHash()', () => {
      const makerTokenValue = 1000
      const takerTokenValue = 2000
      let madeOrder

      before(async () => {
        madeOrder = await tl1.exchange.makeOrder(
          exchangeAddress,
          makerTokenAddress,
          takerTokenAddress,
          makerTokenValue,
          takerTokenValue
        )
      })

      it('should return order by its hash', async () => {
        const returnedOrder = await tl1.exchange.getOrderByHash(madeOrder.hash)
        expect({
          ...returnedOrder,
          hash: madeOrder.hash
        }).to.deep.equal(madeOrder)
      })
    })

    describe('getOrders()', () => {
      const makerTokenValue = 100
      const takerTokenValue = 200
      let madeOrder1
      let madeOrder2

      before(async () => {
        madeOrder1 = await tl1.exchange.makeOrder(
          exchangeAddress,
          makerTokenAddress,
          takerTokenAddress,
          makerTokenValue,
          takerTokenValue
        )
        madeOrder2 = await tl2.exchange.makeOrder(
          exchangeAddress,
          takerTokenAddress,
          makerTokenAddress,
          takerTokenValue,
          makerTokenValue
        )
      })

      it('should return 2 already created orders', async () => {
        const allOrders = await tl1.exchange.getOrders()
        const filteredOrders = allOrders.filter(
          ({ hash }) => hash === madeOrder1.hash || hash === madeOrder2.hash
        )
        expect(filteredOrders.length).to.equal(2)
      })

      it('should return only orders of specific user', async () => {
        const ordersOfUser1 = await tl1.exchange.getOrders({
          maker: tl1.user.address
        })
        const filteredOrders = ordersOfUser1.filter(
          ({ hash }) => hash === madeOrder1.hash
        )
        expect(filteredOrders.length).to.equal(1)
      })

      it('should return one order', async () => {
        const order1 = await tl1.exchange.getOrders({
          exchangeContractAddress: exchangeAddress,
          tokenAddress: makerTokenAddress,
          trader: tl1.user.address
        })
        const filteredOrders = order1.filter(
          ({ hash }) => hash === madeOrder1.hash
        )
        expect(filteredOrders.length).to.equal(1)
      })
    })

    describe('#prepTakeOrder()', () => {
      let order

      before(async () => {
        order = await tl1.exchange.makeOrder(
          exchangeAddress,
          makerTokenAddress,
          takerTokenAddress,
          1,
          2
        )
      })

      it('should prepare a fill order tx for latest order', async () => {
        await expect(
          tl2.exchange.prepTakeOrder(order, 1)
        ).to.eventually.have.keys(
          'rawTx',
          'txFees',
          'makerMaxFees',
          'makerPath',
          'takerMaxFees',
          'takerPath'
        )
      })
    })

    describe('#confirm() - TL money <-> TL money', () => {
      let makerTLBefore
      let takerTLBefore
      let order
      let fillTxHash

      before(async () => {
        order = await tl1.exchange.makeOrder(
          exchangeAddress,
          makerTokenAddress,
          takerTokenAddress,
          1,
          1
        )
        const trustlines = await Promise.all([
          tl2.trustline.get(makerTokenAddress, tl1.user.address),
          tl2.trustline.get(takerTokenAddress, tl1.user.address)
        ])
        makerTLBefore = trustlines[0]
        takerTLBefore = trustlines[1]
      })

      it('should confirm a signed fill order tx for TL money <-> TL money order', async () => {
        const { rawTx } = await tl2.exchange.prepTakeOrder(order, 0.5)
        fillTxHash = await tl2.exchange.confirm(rawTx)
        await wait()
        const trustlines = await Promise.all([
          tl2.trustline.get(makerTokenAddress, tl1.user.address),
          tl2.trustline.get(takerTokenAddress, tl1.user.address)
        ])
        const makerTLAfter = trustlines[0]
        const takerTLAfter = trustlines[1]
        const makerBalanceDelta = Math.abs(
          new BigNumber(makerTLBefore.balance.raw)
            .minus(makerTLAfter.balance.raw)
            .toNumber()
        )
        const takerBalanceDelta = Math.abs(
          new BigNumber(takerTLBefore.balance.raw)
            .minus(takerTLAfter.balance.raw)
            .toNumber()
        )
        expect(makerBalanceDelta).to.be.at.least(0.5)
        expect(takerBalanceDelta).to.be.at.least(0.5)
      })

      it('should return LogFill event', async () => {
        const logs = await tl1.exchange.getLogs(exchangeAddress)
        const [latestLogFill] = logs.filter(
          ({ transactionHash }) => transactionHash === fillTxHash
        )
        expect(latestLogFill.orderHash).to.equal(order.hash)
      })
    })

    describe('#prepCancelOrder', () => {
      let order
      let txHash

      before(async () => {
        order = await tl1.exchange.makeOrder(
          exchangeAddress,
          makerTokenAddress,
          takerTokenAddress,
          1,
          2
        )
        const { rawTx } = await tl1.exchange.prepCancelOrder(order, 1)
        txHash = await tl1.exchange.confirm(rawTx)
        await wait()
      })

      it('should return tx hash', async () => {
        expect(txHash).to.be.a('string')
      })

      it('should return LogCancel event', async () => {
        const logs = await tl1.exchange.getLogs(exchangeAddress)
        const latestLog = logs[logs.length - 1]
        expect(latestLog.type).to.eq('LogCancel')
        expect(latestLog.transactionHash).to.eq(txHash)
        expect(latestLog.orderHash).to.eq(order.hash)
      })
    })

    describe('#getLogs', () => {
      const exEventKeys = [
        'exchangeAddress',
        'makerTokenAddress',
        'takerTokenAddress',
        'orderHash',
        'type',
        'timestamp',
        'blockNumber',
        'status',
        'transactionHash',
        'blockHash',
        'logIndex',
        'from',
        'to',
        'direction'
      ]
      const fillEventKeys = exEventKeys.concat([
        'filledMakerAmount',
        'filledTakerAmount'
      ])
      const cancelEventKeys = exEventKeys.concat([
        'cancelledMakerAmount',
        'cancelledTakerAmount'
      ])
      let order
      let fillTxHash
      let cancelTxHash

      before(async () => {
        order = await tl1.exchange.makeOrder(
          exchangeAddress,
          makerTokenAddress,
          takerTokenAddress,
          3,
          3
        )
        const [fillTx, cancelTx] = await Promise.all([
          tl2.exchange.prepTakeOrder(order, 1),
          tl1.exchange.prepCancelOrder(order, 1)
        ])
        const txHashs = await Promise.all([
          tl2.exchange.confirm(fillTx.rawTx),
          tl1.exchange.confirm(cancelTx.rawTx)
        ])
        fillTxHash = txHashs[0]
        cancelTxHash = txHashs[1]
        await wait()
      })

      it('should return all exchange events', async () => {
        const events = await tl1.exchange.getLogs(exchangeAddress)
        const filteredEvents = events.filter(e => e.orderHash === order.hash)
        const [fillEvent] = filteredEvents.filter(e => e.type === 'LogFill')
        const [cancelEvent] = filteredEvents.filter(e => e.type === 'LogCancel')
        expect(filteredEvents).to.have.length(2)
        expect(fillEvent).to.include.all.keys(fillEventKeys)
        expect(fillEvent.transactionHash).to.equal(fillTxHash)
        expect(cancelEvent).to.include.all.keys(cancelEventKeys)
        expect(cancelEvent.transactionHash).to.equal(cancelTxHash)
      })

      it('should return LogFill events', async () => {
        const fillEvents = await tl1.exchange.getLogs(exchangeAddress, {
          type: 'LogFill'
        })
        const filteredEvents = fillEvents.filter(
          e => e.orderHash === order.hash
        )
        expect(filteredEvents).to.have.length(1)
        expect(filteredEvents[0]).to.include.all.keys(fillEventKeys)
        expect(filteredEvents[0].type).to.equal('LogFill')
        expect(filteredEvents[0].transactionHash).to.equal(fillTxHash)
      })

      it('should return LogCancel events', async () => {
        const cancelEvents = await tl1.exchange.getLogs(exchangeAddress, {
          type: 'LogCancel'
        })
        const filteredEvents = cancelEvents.filter(
          e => e.orderHash === order.hash
        )
        expect(filteredEvents).to.have.length(1)
        expect(filteredEvents[0]).to.include.all.keys(cancelEventKeys)
        expect(filteredEvents[0].type).to.equal('LogCancel')
        expect(filteredEvents[0].transactionHash).to.equal(cancelTxHash)
      })
    })

    // TODO scenario for TL money <-> token
    describe.skip('#confirm() - TL money <-> token', () => {
      const DUMMY_TOKEN_ADDRESS = '0x'

      let makerTLBefore
      let tokenBalanceBefore

      before(done => {
        tl1.exchange
          .makeOrder(
            exchangeAddress,
            makerTokenAddress,
            DUMMY_TOKEN_ADDRESS,
            1,
            1,
            {
              makerTokenDecimals: 2,
              takerTokenDecimals: 2
            }
          )
          .then(() =>
            tl1.exchange.getOrderbook(makerTokenAddress, DUMMY_TOKEN_ADDRESS, {
              baseTokenDecimals: 2,
              quoteTokenDecimals: 2
            })
          )
          .then(
            orderbook =>
              (latestOrder = orderbook.asks[orderbook.asks.length - 1])
          )
          .then(() =>
            Promise.all([
              tl2.trustline.getAll(makerTokenAddress)
              // TODO get balance of dummy token
            ]).then(([makerTrustlines]) => {
              makerTLBefore = makerTrustlines.find(
                tl => tl.counterParty === tl1.user.address
              )
              tokenBalanceBefore = 0
              done()
            })
          )
          .catch(e => done(e))
      })

      it('should confirm a signed fill order tx for TL money <-> TL money order', done => {
        tl2.exchange
          .prepTakeOrder(latestOrder, 0.5)
          .then(tx => tl2.exchange.confirm(tx.rawTx))
          .then(txHash => {
            setTimeout(() => {
              expect(txHash).to.be.a('string')
              Promise.all([
                tl2.trustline.getAll(makerTokenAddress)
                // TODO get dummy token balance
              ]).then(([makerTrustlines]) => {
                const makerTLAfter = makerTrustlines.find(
                  tl => tl.counterParty === tl1.user.address
                )
                const tokenBalanceAfter = 1
                const makerBalanceDelta = Math.abs(
                  parseInt(makerTLBefore.balance.value, 10) -
                    parseInt(makerTLAfter.balance.value, 10)
                )
                const tokenBalanceDelta = Math.abs(
                  tokenBalanceBefore - tokenBalanceAfter
                )
                expect(makerTLAfter.balance.value).to.be.above(0)
                expect(tokenBalanceAfter).to.be.below(0)
                expect(makerBalanceDelta).to.equal(tokenBalanceDelta)
                done()
              })
            }, 1000)
          })
      })
    })
  })
})
