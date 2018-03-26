import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, user1, keystore2 } from '../Fixtures'

chai.use(chaiAsPromised)

describe('e2e', () => {
  describe('Exchange', () => {
    const { expect } = chai
    const tl1 = new TLNetwork(config)
    const tl2 = new TLNetwork(config)
    let user1
    let user2
    let exchangeAddress
    let dummyTokenAddress
    let makerTokenAddress
    let takerTokenAddress

    before(done => {
      // load users
      Promise.all([tl1.user.load(keystore1), tl2.user.load(keystore2)])
        .then(users => [ user1, user2 ] = users)
        // get availabe exchange contracts
        .then(() => tl1.exchange.getExchanges())
        .then(exchanges => {
          exchangeAddress = exchanges[0]
        })
        // get all currency networks
        .then(() => tl1.currencyNetwork.getAll())
        .then(networks => {
          const [ x, y ] = networks.filter(n => n.abbreviation === 'EUR' || n.abbreviation === 'USD')
          makerTokenAddress = x.address
          takerTokenAddress = y.address
        })
        // make sure users have eth
        .then(() => Promise.all([tl1.user.requestEth(), tl2.user.requestEth()]))
        // set up trustline in maker token network
        .then(() => Promise.all([
          tl1.trustline.prepareUpdate(makerTokenAddress, user2.address, 100, 200),
          tl2.trustline.prepareAccept(makerTokenAddress, user1.address, 200, 100)
        ]))
        .then(([ tx1, tx2 ]) => Promise.all([
          tl1.trustline.confirm(tx1.rawTx),
          tl2.trustline.confirm(tx2.rawTx)
        ]))
        // wait for txs to be mined
        .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
        // set trustline in taker token network
        .then(() => Promise.all([
          tl1.trustline.prepareUpdate(takerTokenAddress, user2.address, 300, 400),
          tl2.trustline.prepareAccept(takerTokenAddress, user1.address, 400, 300)
        ]))
        .then(([ tx1, tx2 ]) => Promise.all([
          tl1.trustline.confirm(tx1.rawTx),
          tl2.trustline.confirm(tx2.rawTx)
        ]))
        // wait for txs to be mined
        .then(() => new Promise(resolve => setTimeout(resolve, 1000)))
        .then(() => done())
    })

    describe('#getExchanges()', () => {
      it('should return array', () => {
        expect(tl1.exchange.getExchanges()).to.eventually.be.an('array')
      })
    })

    describe('#getEthWrappers()', () => {
      it('should return array', () => {
        expect(tl1.exchange.getEthWrappers()).to.eventually.be.an('array')
      })
    })

    describe('#getOrderbook()', () => {
      it('should return orderbook', () => {
        expect(tl1.exchange.getOrderbook(makerTokenAddress, takerTokenAddress))
          .to.eventually.have.keys('asks', 'bids')
      })
    })

    describe('#makeOrder()', () => {
      it('should make order', done => {
        tl1.exchange.makeOrder(
          exchangeAddress,
          makerTokenAddress,
          takerTokenAddress,
          1000,
          2000
        ).then(res => {
          expect(res).to.equal(null)
          done()
        })
      })
    })

    describe('#prepTakeOrder()', () => {
      let latestOrder

      before(done => {
        tl1.exchange.makeOrder(exchangeAddress, makerTokenAddress, takerTokenAddress, 1, 2)
          .then(() => tl1.exchange.getOrderbook(makerTokenAddress, takerTokenAddress))
          .then(orderbook => latestOrder = orderbook.asks[orderbook.asks.length - 1])
          .then(() => done())
          .catch(e => done(e))
      })

      it('should prepare a fill order tx for latest order', () => {
        const {
          exchangeContractAddress,
          maker,
          makerTokenAddress,
          takerTokenAddress,
          makerTokenAmount,
          takerTokenAmount,
          salt,
          expirationUnixTimestampSec,
          ecSignature
        } = latestOrder
        expect(tl2.exchange.prepTakeOrder(
          exchangeContractAddress,
          maker,
          makerTokenAddress,
          takerTokenAddress,
          makerTokenAmount.value,
          takerTokenAmount.value,
          1, // fillTakerTokenAmount
          salt,
          expirationUnixTimestampSec,
          ecSignature.v,
          ecSignature.r,
          ecSignature.s
        )).to.eventually.have.keys(
          'rawTx', 'ethFees', 'makerMaxFees', 'makerPath', 'takerMaxFees', 'takerPath'
        )
      })
    })

    describe('#confirm() - TL money <-> TL money', () => {
      let latestOrder
      let makerTLBefore
      let takerTLBefore

      before(done => {
        tl1.exchange.makeOrder(exchangeAddress, makerTokenAddress, takerTokenAddress, 1, 1)
          .then(() => tl1.exchange.getOrderbook(makerTokenAddress, takerTokenAddress))
          .then(orderbook => latestOrder = orderbook.asks[orderbook.asks.length - 1])
          .then(() => Promise.all([
            tl2.trustline.getAll(makerTokenAddress),
            tl2.trustline.getAll(takerTokenAddress)
          ])
          .then(([ makerTrustlines, takerTrustlines ]) => {
            makerTLBefore = makerTrustlines.find(tl => tl.address === tl1.user.address)
            takerTLBefore = takerTrustlines.find(tl => tl.address === tl1.user.address)
            done()
          }))
          .catch(e => done(e))
      })

      it('should confirm a signed fill order tx for TL money <-> TL money order', done => {
        const {
          exchangeContractAddress,
          maker,
          makerTokenAddress,
          takerTokenAddress,
          makerTokenAmount,
          takerTokenAmount,
          salt,
          expirationUnixTimestampSec,
          ecSignature
        } = latestOrder
        tl2.exchange.prepTakeOrder(
          exchangeContractAddress,
          maker,
          makerTokenAddress,
          takerTokenAddress,
          makerTokenAmount.value,
          takerTokenAmount.value,
          0.5, // fillTakerTokenAmount
          salt,
          expirationUnixTimestampSec,
          ecSignature.v,
          ecSignature.r,
          ecSignature.s
        )
        .then(tx => tl2.exchange.confirm(tx.rawTx))
        .then(txId => {
          setTimeout(() => {
            expect(txId).to.be.a('string')
            Promise.all([
              tl2.trustline.getAll(makerTokenAddress),
              tl2.trustline.getAll(takerTokenAddress)
            ]).then(([ makerTrustlines, takerTrustlines ]) => {
              const makerTLAfter = makerTrustlines.find(tl => tl.address === tl1.user.address)
              const takerTLAfter = takerTrustlines.find(tl => tl.address === tl1.user.address)
              const makerBalanceDelta = Math.abs(makerTLBefore.balance.value - makerTLAfter.balance.value)
              const takerBalanceDelta = Math.abs(takerTLBefore.balance.value - takerTLAfter.balance.value)
              expect(makerTLAfter.balance.value).to.be.above(0)
              expect(takerTLAfter.balance.value).to.be.below(0)
              expect(makerBalanceDelta).to.equal(takerBalanceDelta)
              done()
            })
          }, 1000)
        })
      })
    })
  })
})
