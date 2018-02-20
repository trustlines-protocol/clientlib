import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../../src/TLNetwork'
import { config, keystore1, user1 } from '../Fixtures'

chai.use(chaiAsPromised)

describe.only('e2e', () => {
  describe('Exchange', () => {
    const { expect } = chai
    const tl = new TLNetwork(config)
    let exchangeAddress
    let baseTokenAddress
    let quoteTokenAddress

    before(done => {
      tl.user.load(keystore1)
        .then(() => tl.exchange.getExchanges())
        .then(exchanges => exchangeAddress = exchanges[0])
        .then(() => tl.currencyNetwork.getAll())
        .then(([ base, quote ]) => {
          baseTokenAddress = base.address
          quoteTokenAddress = quote.address
          done()
        })
    })

    describe('#getExchanges()', () => {
      it('should return array', () => {
        expect(tl.exchange.getExchanges()).to.eventually.be.an('array')
      })
    })

    describe('#getOrderbook()', () => {
      it('should return orderbook', () => {
        expect(tl.exchange.getOrderbook(baseTokenAddress, quoteTokenAddress))
          .to.eventually.have.keys('asks', 'bids')
      })
    })

    describe('#makeOrder()', () => {
      it('should make order', done => {
        // TODO
        tl.exchange.makeOrder(
          exchangeAddress,
          baseTokenAddress,
          quoteTokenAddress,
          1000,
          2000
        ).then(res => done())
      })
    })
  })
})
