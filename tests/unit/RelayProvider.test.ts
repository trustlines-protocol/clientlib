import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import { RelayProvider } from '../../src/providers/RelayProvider'

import { FakeUtils } from '../helpers/FakeUtils'

import {
  FAKE_RELAY_API,
  FAKE_SIGNED_TX,
  FAKE_USER_ADDRESSES
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('RelayProvider', () => {
    // Test object
    let relayProvider: RelayProvider

    const init = () => {
      relayProvider = new RelayProvider(
        FAKE_RELAY_API,
        FAKE_RELAY_API,
        new FakeUtils()
      )
    }

    describe('#getBalance()', () => {
      beforeEach(() => init())

      it('should return balance as BN', async () => {
        const balance = await relayProvider.getBalance(FAKE_USER_ADDRESSES[0])
        assert.instanceOf(balance, ethers.utils.BigNumber)
      })
    })

    describe('#getTransactionCount()', () => {
      beforeEach(() => init())

      it('should return nonce', async () => {
        const nonce = await relayProvider.getTransactionCount(
          FAKE_USER_ADDRESSES[0]
        )
        assert.isNumber(nonce)
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

    describe('#getBlockNumber()', () => {
      beforeEach(() => init())

      it('should return block number', async () => {
        const blockNumber = await relayProvider.getBlockNumber()
        assert.isNumber(blockNumber)
      })
    })

    describe('#sendTransaction()', () => {
      const TRANSACTION_RESPONSE_KEYS = [
        'chainId',
        'confirmations',
        'data',
        'from',
        'gasLimit',
        'gasPrice',
        'hash',
        'nonce',
        'r',
        'raw',
        's',
        'to',
        'v',
        'value',
        'wait'
      ]

      beforeEach(() => init())

      it('should send string signed transaction', async () => {
        const txResponse = await relayProvider.sendTransaction(FAKE_SIGNED_TX)
        assert.hasAllKeys(txResponse, TRANSACTION_RESPONSE_KEYS)
      })

      it('should send promise signed transaction', async () => {
        const txResponse = await relayProvider.sendTransaction(
          Promise.resolve(FAKE_SIGNED_TX)
        )
        assert.hasAllKeys(txResponse, TRANSACTION_RESPONSE_KEYS)
      })
    })

    describe('#relayTx()', () => {
      beforeEach(() => init())

      it('should relay signed transaction', async () => {
        const txHash = await relayProvider.relayTx(FAKE_SIGNED_TX)
        assert.isString(txHash)
      })
    })
  })
})
