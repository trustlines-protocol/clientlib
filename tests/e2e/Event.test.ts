import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'
import {
  AnyNetworkEvent,
  ExchangeCancelEvent,
  ExchangeFillEvent,
  NetworkDetails,
  NetworkTransferEvent,
  NetworkTrustlineUpdateEvent,
  TokenAmountEvent
} from '../../src/typings'

import {
  createAndLoadUsers,
  deployIdentities,
  extraData,
  requestEth,
  setTrustlines,
  tlNetworkConfig,
  wait
} from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe(`Events`, () => {
    const { expect } = chai

    const tl1 = new TLNetwork(tlNetworkConfig)
    const tl2 = new TLNetwork(tlNetworkConfig)
    let user1
    let user2
    let networks
    let network1
    let network2
    let ethWrapperAddress
    let exchangeAddress

    before(async () => {
      // fetch networks and use only networks with 2 decimals
      ;[networks, [ethWrapperAddress], [exchangeAddress]] = await Promise.all([
        tl1.currencyNetwork.getAll(),
        tl1.ethWrapper.getAddresses(),
        tl1.exchange.getExAddresses()
      ])
      const networksWithDetails = await Promise.all(
        networks.map(n => tl1.currencyNetwork.getInfo(n.address))
      )
      const networksWith2Decimals = networksWithDetails.filter(
        n => (n as NetworkDetails).decimals === 4
      )
      network1 = networksWith2Decimals[0]
      network2 = networksWith2Decimals[1]
    })

    describe('#get()', () => {
      before(async () => {
        // create new users
        ;[user1, user2] = await createAndLoadUsers([tl1, tl2])
        await deployIdentities([tl1, tl2])
        // request ETH
        await requestEth([tl1, tl2])
        // set trustlines
        await setTrustlines(network1.address, tl1, tl2, 100, 200)
        // trustline transfer
        const { rawTx } = await tl1.payment.prepare(
          network1.address,
          user2.address,
          1.5,
          { extraData }
        )
        await tl1.payment.confirm(rawTx)
        await wait()
      })

      it('should return latest transfer', async () => {
        const events = await tl1.event.get<NetworkTransferEvent>(
          network1.address
        )
        const last = events[events.length - 1]
        expect(last.type).to.equal('Transfer')
        expect(last.direction).to.equal('sent')
        expect(last.from).to.equal(user1.address)
        expect(last.to).to.equal(user2.address)
        expect(last.blockNumber).to.be.a('number')
        expect(last.timestamp).to.be.a('number')
        expect(last.counterParty).to.equal(user2.address)
        expect(last.user).to.equal(user1.address)
        expect(last.networkAddress).to.equal(network1.address)
        expect(last.status).to.be.a('string')
        expect(last.amount).to.have.keys('raw', 'value', 'decimals')
        expect(last.amount.value).to.eq('1.5')
        expect(last.extraData).to.eq(extraData)
        expect(last.logIndex).to.be.a('number')
        expect(last.blockHash).to.be.a('string')
      })
    })

    describe('#getAll()', async () => {
      let updateTxHash
      let acceptTxHash
      let cancelUpdateTxHash
      let tlTransferTxHash
      let depositTxHash
      let withdrawTxHash
      let transferTxHash
      let fillTxHash
      let cancelTxHash
      let order

      before(async () => {
        // create new users
        ;[user1, user2] = await createAndLoadUsers([tl1, tl2])
        await deployIdentities([tl1, tl2])
        // request ETH
        await requestEth([tl1, tl2])
        // set trustlines
        await setTrustlines(network1.address, tl1, tl2, 100, 200)

        // CurrencyNetwork events
        const updateTx = await tl1.trustline.prepareUpdate(
          network2.address,
          user2.address,
          1000,
          500
        )
        updateTxHash = await tl1.trustline.confirm(updateTx.rawTx)
        await wait()
        const cancelUpdateTx = await tl1.trustline.prepareCancelTrustlineUpdate(
          network2.address,
          user2.address
        )
        cancelUpdateTxHash = await tl1.trustline.confirm(cancelUpdateTx.rawTx)
        await wait()
        const secondUpdateTx = await tl1.trustline.prepareUpdate(
          network2.address,
          user2.address,
          1000,
          500
        )
        await tl1.trustline.confirm(secondUpdateTx.rawTx)
        await wait()
        const acceptTx = await tl2.trustline.prepareUpdate(
          network2.address,
          user1.address,
          500,
          1000
        )
        acceptTxHash = await tl2.trustline.confirm(acceptTx.rawTx)
        await wait()
        const tlTransferTx = await tl1.payment.prepare(
          network2.address,
          user2.address,
          1,
          { extraData }
        )
        tlTransferTxHash = await tl1.payment.confirm(tlTransferTx.rawTx)
        await wait()

        // Token events
        const depositTx = await tl1.ethWrapper.prepDeposit(
          ethWrapperAddress,
          0.005
        )
        depositTxHash = await tl1.ethWrapper.confirm(depositTx.rawTx)
        await wait()
        const withdrawTx = await tl1.ethWrapper.prepWithdraw(
          ethWrapperAddress,
          0.001
        )
        withdrawTxHash = await tl1.ethWrapper.confirm(withdrawTx.rawTx)
        await wait()
        const transferTx = await tl1.ethWrapper.prepTransfer(
          ethWrapperAddress,
          tl2.user.address,
          0.002
        )
        transferTxHash = await tl1.ethWrapper.confirm(transferTx.rawTx)
        await wait()

        // Exchange events
        order = await tl1.exchange.makeOrder(
          exchangeAddress,
          network1.address,
          network2.address,
          3,
          3
        )
        const [fillTx, cancelTx] = await Promise.all([
          tl2.exchange.prepTakeOrder(order, 1),
          tl1.exchange.prepCancelOrder(order, 1)
        ])

        const exTxHashs = await Promise.all([
          tl2.exchange.confirm(fillTx.rawTx),
          tl1.exchange.confirm(cancelTx.rawTx)
        ])
        fillTxHash = exTxHashs[0]
        cancelTxHash = exTxHashs[1]
        await wait()
      })

      it('should return all events', async () => {
        const allEvents = await tl1.event.getAll()

        // events thrown on trustline update request
        const updateRequestEvents = allEvents.filter(
          ({ transactionHash }) => transactionHash === updateTxHash
        )
        // check event TrustlineUpdateRequest
        expect(
          updateRequestEvents,
          'Trustline Update Request should exist'
        ).to.have.length(1)
        expect(updateRequestEvents[0].type).to.equal('TrustlineUpdateRequest')
        expect(updateRequestEvents[0].timestamp).to.be.a('number')
        expect(updateRequestEvents[0].blockNumber).to.be.a('number')
        expect(updateRequestEvents[0].status).to.be.a('string')
        expect(updateRequestEvents[0].transactionHash).to.equal(updateTxHash)
        expect(updateRequestEvents[0].blockHash).to.be.a('string')
        expect(updateRequestEvents[0].logIndex).to.be.a('number')
        expect(updateRequestEvents[0].direction).to.equal('sent')
        expect(updateRequestEvents[0].from).to.equal(tl1.user.address)
        expect(updateRequestEvents[0].to).to.equal(tl2.user.address)
        expect(updateRequestEvents[0].user).to.equal(tl1.user.address)
        expect(updateRequestEvents[0].counterParty).to.equal(tl2.user.address)
        expect(
          (updateRequestEvents[0] as NetworkTrustlineUpdateEvent).networkAddress
        ).to.equal(network2.address)
        expect(
          (updateRequestEvents[0] as NetworkTrustlineUpdateEvent).isFrozen
        ).to.be.a('boolean')
        expect(
          (updateRequestEvents[0] as NetworkTrustlineUpdateEvent).given
        ).to.have.keys('raw', 'decimals', 'value')
        expect(
          (updateRequestEvents[0] as NetworkTrustlineUpdateEvent).received
        ).to.have.keys('raw', 'decimals', 'value')

        // events thrown on trustline update cancel
        const cancelUpdateEvents = allEvents.filter(
          ({ transactionHash }) => transactionHash === cancelUpdateTxHash
        )
        // check event TrustlineUpdateCancel
        expect(
          cancelUpdateEvents,
          'Trustline Update Cancel should exist'
        ).to.have.length(1)
        expect(cancelUpdateEvents[0].type).to.equal('TrustlineUpdateCancel')
        expect(cancelUpdateEvents[0].timestamp).to.be.a('number')
        expect(cancelUpdateEvents[0].blockNumber).to.be.a('number')
        expect(cancelUpdateEvents[0].status).to.be.a('string')
        expect(cancelUpdateEvents[0].transactionHash).to.equal(
          cancelUpdateTxHash
        )
        expect(cancelUpdateEvents[0].blockHash).to.be.a('string')
        expect(cancelUpdateEvents[0].logIndex).to.be.a('number')
        expect(cancelUpdateEvents[0].direction).to.equal('sent')
        expect(cancelUpdateEvents[0].from).to.equal(tl1.user.address)
        expect(cancelUpdateEvents[0].to).to.equal(tl2.user.address)
        expect(cancelUpdateEvents[0].user).to.equal(tl1.user.address)
        expect(cancelUpdateEvents[0].counterParty).to.equal(tl2.user.address)
        expect(
          (cancelUpdateEvents[0] as NetworkTrustlineUpdateEvent).networkAddress
        ).to.equal(network2.address)

        // events thrown on trustline update
        const updateEvents = allEvents.filter(
          ({ transactionHash }) => transactionHash === acceptTxHash
        )
        // check event TrustlineUpdate
        expect(updateEvents, 'Trustline Update should exist').to.have.length(1)
        expect(updateEvents[0].type).to.equal('TrustlineUpdate')
        expect(updateEvents[0].timestamp).to.be.a('number')
        expect(updateEvents[0].blockNumber).to.be.a('number')
        expect(updateEvents[0].status).to.be.a('string')
        expect(updateEvents[0].transactionHash).to.equal(acceptTxHash)
        expect(updateEvents[0].blockHash).to.be.a('string')
        expect(updateEvents[0].logIndex).to.be.a('number')
        expect(updateEvents[0].direction).to.equal('sent')
        expect(updateEvents[0].from).to.equal(tl1.user.address)
        expect(updateEvents[0].to).to.equal(tl2.user.address)
        expect(updateEvents[0].user).to.equal(tl1.user.address)
        expect(updateEvents[0].counterParty).to.equal(tl2.user.address)
        expect(
          (updateEvents[0] as NetworkTrustlineUpdateEvent).networkAddress
        ).to.equal(network2.address)
        expect(
          (updateEvents[0] as NetworkTrustlineUpdateEvent).isFrozen
        ).to.be.a('boolean')
        expect(
          (updateEvents[0] as NetworkTrustlineUpdateEvent).given
        ).to.have.keys('raw', 'decimals', 'value')
        expect(
          (updateEvents[0] as NetworkTrustlineUpdateEvent).received
        ).to.have.keys('raw', 'decimals', 'value')

        // events thrown on trustlines transfer
        const tlTransferEvents = allEvents.filter(
          ({ transactionHash }) => transactionHash === tlTransferTxHash
        )
        // check event Trustlines Transfer
        expect(
          tlTransferEvents,
          'Trustline Transfer should exist'
        ).to.have.length(1)
        expect(tlTransferEvents[0].type).to.equal('Transfer')
        expect(tlTransferEvents[0].timestamp).to.be.a('number')
        expect(tlTransferEvents[0].blockNumber).to.be.a('number')
        expect(tlTransferEvents[0].status).to.be.a('string')
        expect(tlTransferEvents[0].transactionHash).to.equal(tlTransferTxHash)
        expect(tlTransferEvents[0].blockHash).to.be.a('string')
        expect(tlTransferEvents[0].logIndex).to.be.a('number')
        expect(tlTransferEvents[0].from).to.equal(tl1.user.address)
        expect(tlTransferEvents[0].to).to.equal(tl2.user.address)
        expect(tlTransferEvents[0].direction).to.equal('sent')
        expect(tlTransferEvents[0].user).to.equal(tl1.user.address)
        expect(tlTransferEvents[0].counterParty).to.equal(tl2.user.address)
        expect(
          (tlTransferEvents[0] as NetworkTransferEvent).networkAddress
        ).to.equal(network2.address)
        expect(
          (tlTransferEvents[0] as NetworkTransferEvent).amount
        ).to.have.keys('raw', 'decimals', 'value')
        expect(
          (tlTransferEvents[0] as NetworkTransferEvent).extraData
        ).to.equal(extraData)

        // events thrown on deposit
        const depositEvents = allEvents.filter(
          ({ transactionHash }) => transactionHash === depositTxHash
        )
        // check event Deposit
        expect(depositEvents, 'Deposit should exist').to.have.length(1)
        expect(depositEvents[0].type).to.equal('Deposit')
        expect(depositEvents[0].timestamp).to.be.a('number')
        expect(depositEvents[0].blockNumber).to.be.a('number')
        expect(depositEvents[0].status).to.be.a('string')
        expect(depositEvents[0].transactionHash).to.equal(depositTxHash)
        expect(depositEvents[0].blockHash).to.be.a('string')
        expect(depositEvents[0].logIndex).to.be.a('number')
        expect(depositEvents[0].from).to.equal(tl1.user.address)
        expect(depositEvents[0].to).to.equal(tl1.user.address)
        expect(depositEvents[0].user).to.equal(tl1.user.address)
        expect(depositEvents[0].counterParty).to.equal(tl1.user.address)
        expect((depositEvents[0] as TokenAmountEvent).tokenAddress).to.equal(
          ethWrapperAddress
        )
        expect((depositEvents[0] as TokenAmountEvent).amount).to.have.keys(
          'raw',
          'decimals',
          'value'
        )

        // events thrown on withdraw
        const withdrawEvents = allEvents.filter(
          ({ transactionHash }) => transactionHash === withdrawTxHash
        )
        // check event Withdraw
        expect(withdrawEvents, 'Withdraw should exist').to.have.length(1)
        expect(withdrawEvents[0].type).to.equal('Withdrawal')
        expect(withdrawEvents[0].timestamp).to.be.a('number')
        expect(withdrawEvents[0].blockNumber).to.be.a('number')
        expect(withdrawEvents[0].status).to.be.a('string')
        expect(withdrawEvents[0].transactionHash).to.equal(withdrawTxHash)
        expect(withdrawEvents[0].blockHash).to.be.a('string')
        expect(withdrawEvents[0].logIndex).to.be.a('number')
        expect(withdrawEvents[0].from).to.equal(tl1.user.address)
        expect(withdrawEvents[0].to).to.equal(tl1.user.address)
        expect(withdrawEvents[0].user).to.equal(tl1.user.address)
        expect(withdrawEvents[0].counterParty).to.equal(tl1.user.address)
        expect((withdrawEvents[0] as TokenAmountEvent).tokenAddress).to.equal(
          ethWrapperAddress
        )
        expect((withdrawEvents[0] as TokenAmountEvent).amount).to.have.keys(
          'raw',
          'decimals',
          'value'
        )

        // events thrown on wrapped eth transfer
        const wethTransferEvents = allEvents.filter(
          ({ transactionHash, type }) =>
            transactionHash === transferTxHash && type === 'Transfer'
        )
        // check event Wrapped ETH Transfer
        expect(wethTransferEvents, 'ETH Transfer should exist').to.have.length(
          1
        )
        expect(wethTransferEvents[0].type).to.equal('Transfer')
        expect(wethTransferEvents[0].timestamp).to.be.a('number')
        expect(wethTransferEvents[0].blockNumber).to.be.a('number')
        expect(wethTransferEvents[0].status).to.be.a('string')
        expect(wethTransferEvents[0].transactionHash).to.equal(transferTxHash)
        expect(wethTransferEvents[0].blockHash).to.be.a('string')
        expect(wethTransferEvents[0].logIndex).to.be.a('number')
        expect(wethTransferEvents[0].from).to.equal(tl1.user.address)
        expect(wethTransferEvents[0].to).to.equal(tl2.user.address)
        expect(wethTransferEvents[0].direction).to.equal('sent')
        expect(wethTransferEvents[0].user).to.equal(tl1.user.address)
        expect(wethTransferEvents[0].counterParty).to.equal(tl2.user.address)
        expect(
          (wethTransferEvents[0] as TokenAmountEvent).tokenAddress
        ).to.equal(ethWrapperAddress)
        expect((wethTransferEvents[0] as TokenAmountEvent).amount).to.have.keys(
          'raw',
          'decimals',
          'value'
        )

        // events thrown on fill order
        const fillEvents = allEvents.filter(
          ({ transactionHash, type }) =>
            transactionHash === fillTxHash && type === 'LogFill'
        )
        // check event LogFill
        expect(fillEvents, 'Log Fill should exist').to.have.length(1)
        expect(fillEvents[0].type).to.equal('LogFill')
        expect(fillEvents[0].timestamp).to.be.a('number')
        expect(fillEvents[0].blockNumber).to.be.a('number')
        expect(fillEvents[0].status).to.be.a('string')
        expect(fillEvents[0].transactionHash).to.equal(fillTxHash)
        expect(fillEvents[0].blockHash).to.be.a('string')
        expect(fillEvents[0].logIndex).to.be.a('number')
        expect(fillEvents[0].from).to.equal(tl1.user.address)
        expect(fillEvents[0].to).to.equal(tl2.user.address)
        expect((fillEvents[0] as ExchangeFillEvent).exchangeAddress).to.equal(
          exchangeAddress
        )
        expect((fillEvents[0] as ExchangeFillEvent).makerTokenAddress).to.equal(
          network1.address
        )
        expect((fillEvents[0] as ExchangeFillEvent).takerTokenAddress).to.equal(
          network2.address
        )
        expect((fillEvents[0] as ExchangeFillEvent).orderHash).to.equal(
          order.hash
        )
        expect(
          (fillEvents[0] as ExchangeFillEvent).filledMakerAmount
        ).to.have.keys('raw', 'decimals', 'value')
        expect(
          (fillEvents[0] as ExchangeFillEvent).filledTakerAmount
        ).to.have.keys('raw', 'decimals', 'value')

        // events thrown on cancel order
        const cancelEvents = allEvents.filter(
          ({ transactionHash, type }) =>
            transactionHash === cancelTxHash && type === 'LogCancel'
        )
        // check event LogCancel
        expect(cancelEvents, 'Log Cancel should exist').to.have.length(1)
        expect(cancelEvents[0].type).to.equal('LogCancel')
        expect(cancelEvents[0].timestamp).to.be.a('number')
        expect(cancelEvents[0].blockNumber).to.be.a('number')
        expect(cancelEvents[0].status).to.be.a('string')
        expect(cancelEvents[0].transactionHash).to.equal(cancelTxHash)
        expect(cancelEvents[0].blockHash).to.be.a('string')
        expect(cancelEvents[0].logIndex).to.be.a('number')
        expect(cancelEvents[0].from).to.equal(tl1.user.address)
        expect(cancelEvents[0].to).to.equal(tl1.user.address)
        expect(
          (cancelEvents[0] as ExchangeCancelEvent).exchangeAddress
        ).to.equal(exchangeAddress)
        expect(
          (cancelEvents[0] as ExchangeCancelEvent).makerTokenAddress
        ).to.equal(network1.address)
        expect(
          (cancelEvents[0] as ExchangeCancelEvent).takerTokenAddress
        ).to.equal(network2.address)
        expect((cancelEvents[0] as ExchangeCancelEvent).orderHash).to.equal(
          order.hash
        )
        expect(
          (cancelEvents[0] as ExchangeCancelEvent).cancelledMakerAmount
        ).to.have.keys('raw', 'decimals', 'value')
        expect(
          (cancelEvents[0] as ExchangeCancelEvent).cancelledTakerAmount
        ).to.have.keys('raw', 'decimals', 'value')
      })

      it('should return trustline updates from more than one network', async () => {
        const allEvents = await tl1.event.getAll({
          type: 'TrustlineUpdate'
        })
        const networksOfEvents = allEvents.map(e => {
          if ((e as AnyNetworkEvent).networkAddress) {
            return (e as AnyNetworkEvent).networkAddress
          }
        })
        const set = new Set(networksOfEvents)
        const uniqueNetworks = Array.from(set)
        expect(uniqueNetworks.length).to.be.above(1)
      })
    })

    describe('#updateStreamTransfer()', () => {
      const events = []
      let stream

      before(async () => {
        // create new users
        ;[user1, user2] = await createAndLoadUsers([tl1, tl2])
        await deployIdentities([tl1, tl2])
        // request ETH
        await requestEth([tl1, tl2])
        // set trustlines
        await setTrustlines(network1.address, tl1, tl2, 100, 200)
        stream = await tl1.event
          .updateStream()
          .subscribe(event => events.push(event))
        const { rawTx } = await tl1.payment.prepare(
          network1.address,
          user2.address,
          2.5,
          { extraData }
        )
        await tl1.payment.confirm(rawTx)
        await wait()
      })

      it('should receive transfer updates', () => {
        expect(events).to.have.lengthOf(4)

        expect(
          events.filter(event => event.type === 'WebsocketOpen')
        ).to.have.lengthOf(1)
        expect(
          events.filter(event => event.type === 'Transfer')
        ).to.have.lengthOf(1)
        expect(
          events.filter(event => event.type === 'BalanceUpdate')
        ).to.have.lengthOf(1)
        expect(
          events.filter(event => event.type === 'NetworkBalance')
        ).to.have.lengthOf(1)

        const transferEvent = events.filter(
          event => event.type === 'Transfer'
        )[0]
        expect(transferEvent.amount).to.have.keys('raw', 'value', 'decimals')
        expect(transferEvent).to.have.nested.property('amount.value', '2.5')
        expect(transferEvent).to.have.property('direction', 'sent')
        expect(transferEvent).to.have.property('from', user1.address)
        expect(transferEvent).to.have.property('to', user2.address)
        expect(transferEvent).to.have.property('counterParty', user2.address)
        expect(transferEvent).to.have.property('user', user1.address)
        expect(transferEvent).to.have.property('extraData', extraData)
        expect(transferEvent.blockHash).to.be.a('string')
        expect(transferEvent.logIndex).be.a('number')

        const networkBalanceEvent = events.filter(
          event => event.type === 'NetworkBalance'
        )[0]
        expect(networkBalanceEvent.timestamp).to.be.a('number')
        expect(networkBalanceEvent.given).to.have.keys(
          'raw',
          'value',
          'decimals'
        )
        expect(networkBalanceEvent.received).to.have.keys(
          'raw',
          'value',
          'decimals'
        )
        expect(networkBalanceEvent.leftGiven).to.have.keys(
          'raw',
          'value',
          'decimals'
        )
        expect(networkBalanceEvent.leftReceived).to.have.keys(
          'raw',
          'value',
          'decimals'
        )
        expect(networkBalanceEvent).to.have.property('user', user1.address)

        const balanceEvent = events.filter(
          event => event.type === 'BalanceUpdate'
        )[0]
        expect(balanceEvent.timestamp).to.be.a('number')
        expect(balanceEvent.from).to.be.a('string')
        expect(balanceEvent.to).to.be.a('string')
        expect(balanceEvent.given).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.received).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.leftGiven).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.leftReceived).to.have.keys(
          'raw',
          'value',
          'decimals'
        )
        expect(balanceEvent).to.have.property('counterParty', user2.address)
        expect(balanceEvent).to.have.property('user', user1.address)
      })

      after(async () => {
        stream.unsubscribe()
        // make sure stream unsubscribed
        await wait()
      })
    })

    describe('#updateStreamTrustlineRequest()', () => {
      const events = []
      let stream

      before(async () => {
        // create new users
        ;[user1, user2] = await createAndLoadUsers([tl1, tl2])
        await deployIdentities([tl1, tl2])
        // request ETH
        await requestEth([tl1, tl2])
        // set trustlines
        await setTrustlines(network1.address, tl1, tl2, 100, 200)
        stream = await tl2.event
          .updateStream()
          .subscribe(event => events.push(event))
        const { rawTx } = await tl2.trustline.prepareUpdate(
          network1.address,
          user1.address,
          4001,
          4002
        )
        await tl2.trustline.confirm(rawTx)
        await wait()
      })

      it('should receive trustline update request', () => {
        expect(events).to.have.lengthOf(2)

        expect(
          events.filter(event => event.type === 'WebsocketOpen')
        ).to.have.lengthOf(1)
        expect(
          events.filter(event => event.type === 'TrustlineUpdateRequest')
        ).to.have.lengthOf(1)

        const trustlineRequestEvent = events.filter(
          event => event.type === 'TrustlineUpdateRequest'
        )[0]
        expect(trustlineRequestEvent.timestamp).to.be.a('number')
        expect(trustlineRequestEvent.from).to.equal(user2.address)
        expect(trustlineRequestEvent.to).to.equal(user1.address)
        expect(trustlineRequestEvent.counterParty).to.equal(user1.address)
        expect(trustlineRequestEvent.user).to.equal(user2.address)
        expect(trustlineRequestEvent.direction).to.equal('sent')
        expect(trustlineRequestEvent.given).to.have.keys(
          'raw',
          'value',
          'decimals'
        )
        expect(trustlineRequestEvent.received).to.have.keys(
          'raw',
          'value',
          'decimals'
        )
        expect(trustlineRequestEvent.isFrozen).to.be.a('boolean')
        expect(trustlineRequestEvent).to.have.nested.property(
          'given.value',
          '4001'
        )
        expect(trustlineRequestEvent).to.have.nested.property(
          'received.value',
          '4002'
        )
        expect(trustlineRequestEvent.blockHash).to.be.a('string')
        expect(trustlineRequestEvent.logIndex).to.be.a('number')
      })

      after(async () => {
        stream.unsubscribe()
        // make sure stream unsubscribed
        await wait()
      })
    })

    describe('#updateStreamCancelTrustlineUpdate()', () => {
      const events = []
      let stream

      before(async () => {
        // create new users
        ;[user1, user2] = await createAndLoadUsers([tl1, tl2])
        await deployIdentities([tl1, tl2])
        // request ETH
        await requestEth([tl1, tl2])
        // set trustlines
        await setTrustlines(network1.address, tl1, tl2, 100, 200)
        // request an update
        const updateTx = await tl2.trustline.prepareUpdate(
          network1.address,
          user1.address,
          4001,
          4002
        )
        await tl2.trustline.confirm(updateTx.rawTx)
        await wait()

        stream = await tl2.event
          .updateStream()
          .subscribe(event => events.push(event))

        // cancel the update request
        const { rawTx } = await tl2.trustline.prepareCancelTrustlineUpdate(
          network1.address,
          user1.address
        )
        await tl2.trustline.confirm(rawTx)
        await wait()
      })

      it('should receive trustline update cancel', () => {
        expect(events).to.have.lengthOf(2)

        expect(
          events.filter(event => event.type === 'WebsocketOpen')
        ).to.have.lengthOf(1)
        expect(
          events.filter(event => event.type === 'TrustlineUpdateCancel')
        ).to.have.lengthOf(1)

        const trustlineUpdateCancelEvent = events.filter(
          event => event.type === 'TrustlineUpdateCancel'
        )[0]
        expect(trustlineUpdateCancelEvent.timestamp).to.be.a('number')
        expect(trustlineUpdateCancelEvent.from).to.equal(user2.address)
        expect(trustlineUpdateCancelEvent.to).to.equal(user1.address)
        expect(trustlineUpdateCancelEvent.counterParty).to.equal(user1.address)
        expect(trustlineUpdateCancelEvent.user).to.equal(user2.address)
        expect(trustlineUpdateCancelEvent.direction).to.equal('sent')
        expect(trustlineUpdateCancelEvent.blockHash).to.be.a('string')
        expect(trustlineUpdateCancelEvent.logIndex).to.be.a('number')
      })

      after(async () => {
        stream.unsubscribe()
        // make sure stream unsubscribed
        await wait()
      })
    })
  })
})
