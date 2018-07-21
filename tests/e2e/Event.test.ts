import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { AnyNetworkEvent, NetworkTransferEvent } from '../../src/typings'
import { config, keystore1, keystore2, wait } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Events', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let network1
    let network2
    let ethWrapperAddress
    let exchangeAddress

    before(async () => {
      // fetch networks and load users
      [
        [network1, network2],
        [ethWrapperAddress],
        [exchangeAddress],
        user1,
        user2
      ] = await Promise.all([
        tl1.currencyNetwork.getAll(),
        tl1.ethWrapper.getAddresses(),
        tl1.exchange.getExAddresses(),
        tl1.user.load(keystore1),
        tl2.user.load(keystore2)
      ])
      // make sure users have ETH
      await Promise.all([tl1.user.requestEth(), tl2.user.requestEth()])
      // set up trustlines
      const [ tx1, tx2 ] = await Promise.all([
        tl1.trustline.prepareUpdate(network1.address, user2.address, 1000, 500),
        tl2.trustline.prepareUpdate(network1.address, user1.address, 500, 1000)
      ])
      await Promise.all([
        tl1.trustline.confirm(tx1.rawTx),
        tl2.trustline.confirm(tx2.rawTx)
      ])
      // wait for tx to be mined
      await wait()
    })

    describe('#get()', () => {
      before(async () => {
        const { rawTx } = await tl1.payment.prepare(network1.address, user2.address, 1.5)
        await tl1.payment.confirm(rawTx)
        await wait()
      })

      it('should return latest transfer', async () => {
        const events = await tl1.event.get<NetworkTransferEvent>(network1.address)
        const last = events[events.length - 1]
        expect(last.type).to.equal('Transfer')
        expect(last.direction).to.equal('sent')
        expect(last.from).to.equal(user1.address)
        expect(last.to).to.equal(user2.address)
        expect(last.blockNumber).to.be.a('number')
        expect(last.timestamp).to.be.a('number')
        expect(last.address).to.equal(user2.address)
        expect(last.networkAddress).to.equal(network1.address)
        expect(last.status).to.be.a('string')
        expect(last.amount).to.have.keys('raw', 'value', 'decimals')
        expect(last.amount.value).to.eq('1.5')
      })
    })

    describe('#getAll()', async () => {
      let updateTxId
      let tlTransferTxId
      let depositTxId
      let withdrawTxId
      let transferTxId
      let fillTxId
      let cancelTxId

      before(async () => {
        // CurrencyNetwork events
        const [ updateTx1, updateTx2 ] = await Promise.all([
          tl1.trustline.prepareUpdate(network2.address, user2.address, 1000, 500),
          tl2.trustline.prepareUpdate(network2.address, user1.address, 500, 1000)
        ])
        const txIds = await Promise.all([
          tl1.trustline.confirm(updateTx1.rawTx),
          tl2.trustline.confirm(updateTx2.rawTx)
        ])
        updateTxId = txIds[0]
        await wait()
        const tlTransferTx = await tl1.payment.prepare(network2.address, user2.address, 1)
        tlTransferTxId = await tl1.payment.confirm(tlTransferTx.rawTx)
        await wait()
        // Token events
        const depositTx = await tl1.ethWrapper.prepDeposit(ethWrapperAddress, 0.005)
        depositTxId = await tl1.ethWrapper.confirm(depositTx.rawTx)
        await wait()
        const withdrawTx = await tl1.ethWrapper.prepWithdraw(ethWrapperAddress, 0.001)
        withdrawTxId = await tl1.ethWrapper.confirm(withdrawTx.rawTx)
        await wait()
        const transferTx = await tl1.ethWrapper.prepTransfer(ethWrapperAddress, tl2.user.address, 0.002)
        transferTxId = await tl1.ethWrapper.confirm(transferTx.rawTx)
        await wait()
        // Exchange events
        const order = await tl1.exchange.makeOrder(
          exchangeAddress,
          network1.address,
          network2.address,
          3,
          3
        )
        const [ fillTx, cancelTx ] = await Promise.all([
          tl2.exchange.prepTakeOrder(order, 1),
          tl1.exchange.prepCancelOrder(order, 1)
        ])
        const exTxIds = await Promise.all([
          tl2.exchange.confirm(fillTx.rawTx),
          tl1.exchange.confirm(cancelTx.rawTx)
        ])
        fillTxId = exTxIds[0]
        cancelTxId = exTxIds[1]
        await wait()
      })

      it('should return all events', async () => {
        const allEvents = await tl1.event.getAll()
        // events thrown on trustline update
        const updateEvents = allEvents.filter(
          ({ transactionId }) => transactionId === updateTxId
        )
        expect(updateEvents).to.have.length(1)
        // events thrown on trustline transfer
        const tlTransferEvents = allEvents.filter(
          ({ transactionId }) => transactionId === tlTransferTxId
        )
        expect(tlTransferEvents).to.have.length(1)
        // events thrown on deposit
        const depositEvents = allEvents.filter(
          ({ transactionId }) => transactionId === depositTxId
        )
        expect(depositEvents).to.have.length(1)
        // events thrown on withdraw
        const withdrawEvents = allEvents.filter(
          ({ transactionId }) => transactionId === withdrawTxId
        )
        expect(withdrawEvents).to.have.length(1)
        // events thrown on wrapped eth transfer
        const wethTransferEvents = allEvents.filter(
          ({ transactionId }) => transactionId === transferTxId
        )
        expect(wethTransferEvents).to.have.length(2)
        // events thrown on fill order
        const fillEvents = allEvents.filter(
          ({ transactionId }) => transactionId === fillTxId
        )
        expect(fillEvents).to.have.length(3)
        // events thrown on cancel transfer
        const cancelEvents = allEvents.filter(
          ({ transactionId }) => transactionId === cancelTxId
        )
        expect(cancelEvents).to.have.length(1)
      })

      it('should return trustline updates from more than one network', async () => {
        const allEvents = await tl1.event.getAll({ type: 'TrustlineUpdate' })
        const networks = allEvents.map(e => {
          if ((e as AnyNetworkEvent).networkAddress) {
            return (e as AnyNetworkEvent).networkAddress
          }
        })
        const set = new Set(networks)
        const uniqueNetworks = Array.from(set)
        expect(uniqueNetworks.length).to.be.above(1)
      })
    })

    describe('#updateStreamTransfer()', () => {
      let events = []
      let stream

      before(async () => {
        stream = await tl1.event.updateStream().subscribe(event => events.push(event))
        const { rawTx } = await tl1.payment.prepare(network1.address, user2.address, 2.5)
        await tl1.payment.confirm(rawTx)
        await wait()
      })

      it('should receive transfer updates', () => {
        expect(events).to.have.lengthOf(4)

        expect(events.filter((event) => event.type === 'WebsocketOpen')).to.have.lengthOf(1)
        expect(events.filter((event) => event.type === 'Transfer')).to.have.lengthOf(1)
        expect(events.filter((event) => event.type === 'BalanceUpdate')).to.have.lengthOf(1)
        expect(events.filter((event) => event.type === 'NetworkBalance')).to.have.lengthOf(1)

        let transferEvent = events.filter((event) => event.type === 'Transfer')[0]
        expect(transferEvent.amount).to.have.keys('raw', 'value', 'decimals')
        expect(transferEvent).to.have.nested.property('amount.value', '2.5')
        expect(transferEvent).to.have.property('direction', 'sent')
        expect(transferEvent).to.have.property('from', user1.address)
        expect(transferEvent).to.have.property('to', user2.address)
        expect(transferEvent).to.have.property('address', user2.address)

        let networkBalanceEvent = events.filter((event) => event.type === 'NetworkBalance')[0]
        expect(networkBalanceEvent.timestamp).to.be.a('number')
        expect(networkBalanceEvent.given).to.have.keys('raw', 'value', 'decimals')
        expect(networkBalanceEvent.received).to.have.keys('raw', 'value', 'decimals')
        expect(networkBalanceEvent.leftGiven).to.have.keys('raw', 'value', 'decimals')
        expect(networkBalanceEvent.leftReceived).to.have.keys('raw', 'value', 'decimals')

        let balanceEvent = events.filter((event) => event.type === 'BalanceUpdate')[0]
        expect(balanceEvent.timestamp).to.be.a('number')
        expect(balanceEvent.from).to.be.a('string')
        expect(balanceEvent.to).to.be.a('string')
        expect(balanceEvent.given).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.received).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.leftGiven).to.have.keys('raw', 'value', 'decimals')
        expect(balanceEvent.leftReceived).to.have.keys('raw', 'value', 'decimals')
      })

      after(async () => {
        stream.unsubscribe()
        // make sure stream unsubscribed
        await wait()
      })
    })

    describe('#updateStreamTrustlineRequest()', () => {
      let events = []
      let stream

      before(async () => {
        stream = await tl2.event.updateStream().subscribe(event => events.push(event))
        const { rawTx } = await tl2.trustline.prepareUpdate(network1.address, user1.address, 4001, 4002)
        await tl2.trustline.confirm(rawTx)
        await wait()
      })

      it('should receive trustline update request', () => {
        expect(events).to.have.lengthOf(2)

        expect(events.filter((event) => event.type === 'WebsocketOpen')).to.have.lengthOf(1)
        expect(events.filter((event) => event.type === 'TrustlineUpdateRequest')).to.have.lengthOf(1)

        let trustlineRequestEvent = events.filter((event) => event.type === 'TrustlineUpdateRequest')[0]
        expect(trustlineRequestEvent.timestamp).to.be.a('number')
        expect(trustlineRequestEvent.from).to.equal(user2.address)
        expect(trustlineRequestEvent.to).to.equal(user1.address)
        expect(trustlineRequestEvent.address).to.equal(user1.address)
        expect(trustlineRequestEvent.direction).to.equal('sent')
        expect(trustlineRequestEvent.given).to.have.keys('raw', 'value', 'decimals')
        expect(trustlineRequestEvent.received).to.have.keys('raw', 'value', 'decimals')
        expect(trustlineRequestEvent).to.have.nested.property('given.value', '4001')
        expect(trustlineRequestEvent).to.have.nested.property('received.value', '4002')
      })

      after(async () => {
        stream.unsubscribe()
        // make sure stream unsubscribed
        await wait()
      })
    })
  })
})
