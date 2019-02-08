import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import fetchMock = require('fetch-mock')
import 'mocha'

import { RelayProvider } from '../../src/providers/RelayProvider'

import {
  FAKE_RELAY_API,
  FAKE_SIGNED_TX,
  FAKE_TX_HASH,
  FAKE_TX_INFOS,
  FAKE_USER_ADDRESSES
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('RelayProvider', () => {
    after(() => fetchMock.reset())

    // Test object
    let relayProvider: RelayProvider

    const init = () => {
      relayProvider = new RelayProvider(FAKE_RELAY_API, FAKE_RELAY_API)
      fetchMock.reset()
      fetchMock.mock('end:/txinfos', FAKE_TX_INFOS)
      fetchMock.mock('end:/balance', '1000000000')
      fetchMock.mock('end:/blocknumber', JSON.stringify(12345))
      fetchMock.mock('end:/relay', JSON.stringify(FAKE_TX_HASH))
    }

    describe('#getBalance()', () => {
      beforeEach(() => init())

      it('should return balance as BN', async () => {
        const balance = await relayProvider.getBalance(FAKE_USER_ADDRESSES[0])
        assert.hasAllKeys(balance, ['raw', 'value', 'decimals'])
      })
    })

    describe('#getTxInfos()', () => {
      beforeEach(() => init())

      it('should return tx infos', async () => {
        const txInfos = await relayProvider.getTxInfos(FAKE_USER_ADDRESSES[0])
        assert.hasAllKeys(txInfos, ['balance', 'gasPrice', 'nonce'])
        assert.instanceOf(txInfos.balance, BigNumber)
        assert.instanceOf(txInfos.gasPrice, BigNumber)
        assert.isNumber(txInfos.nonce)
      })
    })

    describe('#sendSignedTransaction()', () => {
      beforeEach(() => init())

      it('should send signed transaction and return hash', async () => {
        const txResponse = await relayProvider.sendSignedTransaction(
          FAKE_SIGNED_TX
        )
        assert.isString(txResponse)
      })
    })
  })
})
