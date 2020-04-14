import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'
import { Event } from '../../src/Event'
import { Payment } from '../../src/Payment'
import { Transaction } from '../../src/Transaction'

import { User } from '../../src/User'
import { FakeCurrencyNetwork } from '../helpers/FakeCurrencyNetwork'

import { FakeTLProvider } from '../helpers/FakeTLProvider'
import { FakeTLSigner } from '../helpers/FakeTLSigner'
import { FakeTLWallet } from '../helpers/FakeTLWallet'

import { FAKE_NETWORK } from '../Fixtures'
import { FakeUser } from '../helpers/FakeUser'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('Payment', () => {
    // Test object
    let payment: Payment
    let user: User
    const init = () => {
      const provider = new FakeTLProvider()
      const signer = new FakeTLSigner()
      const wallet = new FakeTLWallet()
      const currencyNetwork = new FakeCurrencyNetwork(provider)
      user = new FakeUser({
        provider,
        signer,
        wallet
      })

      const event = new Event({
        currencyNetwork,
        provider,
        user
      })

      const transaction = new Transaction({
        provider,
        signer,
        currencyNetwork
      })

      payment = new Payment({
        event,
        user,
        transaction,
        currencyNetwork,
        provider
      })
    }

    describe('#createLink()', () => {
      beforeEach(() => init())

      it('should create payment request link with network address and no amount', async () => {
        const paymentRequestLink = await payment.createRequest(
          FAKE_NETWORK.address
        )

        const userAddress = await user.getAddress()

        assert.equal(
          paymentRequestLink,
          `trustlines://paymentrequest/${FAKE_NETWORK.address}/${userAddress}`
        )
      })

      it('should create payment request link with network address and amount', async () => {
        const paymentRequestLink = await payment.createRequest(
          FAKE_NETWORK.address,
          { amount: '100' }
        )

        const userAddress = await user.getAddress()

        assert.equal(
          paymentRequestLink,
          `trustlines://paymentrequest/${
            FAKE_NETWORK.address
          }/${userAddress}/100`
        )
      })

      it('should create payment request link with network address, amount and query params', async () => {
        const paymentRequestLink = await payment.createRequest(
          FAKE_NETWORK.address,

          {
            amount: '100',
            subject: 'subject',
            note: 'my note',
            username: 'username'
          }
        )

        const userAddress = await user.getAddress()

        assert.equal(
          paymentRequestLink,
          `trustlines://paymentrequest/${
            FAKE_NETWORK.address
          }/${userAddress}/100?subject=subject&note=my%20note&username=username`
        )
      })
    })
  })
})
