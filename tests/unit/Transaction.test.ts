import { BigNumber } from 'bignumber.js'
import { assert } from 'chai'
import 'mocha'

import { Transaction } from '../../src/Transaction'

import { FakeTLProvider } from '../helpers/FakeTLProvider'
import { FakeTLSigner } from '../helpers/FakeTLSigner'

import { extraData } from '../Fixtures'

describe('unit', () => {
  describe('Transaction', () => {
    // test object
    let transaction: Transaction

    // test data
    const USER_ADDRESS = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
    const COUNTER_PARTY_ADDRESS = '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18'
    const CONTRACT_ADDRESS = '0xd0a6E6C54DbC68Db5db3A091B171A77407Ff7ccf'
    const EXTRA_DATA = extraData
    const RAW_TX_OBJECT = {
      data:
        '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      from: USER_ADDRESS,
      gasLimit: new BigNumber(10000),
      gasPrice: new BigNumber(10000),
      nonce: 5,
      to: COUNTER_PARTY_ADDRESS,
      value: new BigNumber(10000)
    }

    before(() => {
      transaction = new Transaction({
        provider: new FakeTLProvider(),
        signer: new FakeTLSigner()
      })
    })

    describe('#prepareContractTransaction()', () => {
      it('should prepare a transaction object for calling a function', async () => {
        const rawTxObject = await transaction.prepareContractTransaction(
          USER_ADDRESS,
          CONTRACT_ADDRESS,
          'CurrencyNetwork',
          'transfer',
          [
            COUNTER_PARTY_ADDRESS,
            '10000',
            '0',
            [COUNTER_PARTY_ADDRESS],
            EXTRA_DATA
          ]
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'ethFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'data',
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'nonce'
        ])
        assert.equal(rawTxObject.rawTx.from, USER_ADDRESS)
        assert.equal(rawTxObject.rawTx.to, CONTRACT_ADDRESS)
        assert.instanceOf(rawTxObject.rawTx.value, BigNumber)
        assert.equal(rawTxObject.rawTx.value.toString(), '0')
        assert.instanceOf(rawTxObject.rawTx.gasLimit, BigNumber)
        assert.instanceOf(rawTxObject.rawTx.gasPrice, BigNumber)
        assert.isNumber(rawTxObject.rawTx.nonce)
        assert.isString(rawTxObject.rawTx.data)
        assert.hasAllKeys(rawTxObject.ethFees, ['decimals', 'raw', 'value'])
        assert.equal(rawTxObject.ethFees.decimals, 18)
        assert.instanceOf(rawTxObject.ethFees.raw, BigNumber)
        assert.instanceOf(rawTxObject.ethFees.value, BigNumber)
      })

      it('should prepare a transaction object for calling a function with options', async () => {
        const CUSTOM_GAS_LIMIT = 10000000
        const CUSTOM_GAS_PRICE = 1
        const CUSTOM_VALUE = 123
        const rawTxObject = await transaction.prepareContractTransaction(
          USER_ADDRESS,
          CONTRACT_ADDRESS,
          'CurrencyNetwork',
          'transfer',
          [
            COUNTER_PARTY_ADDRESS,
            '10000',
            '0',
            [COUNTER_PARTY_ADDRESS],
            EXTRA_DATA
          ],
          {
            gasLimit: new BigNumber(CUSTOM_GAS_LIMIT),
            gasPrice: new BigNumber(CUSTOM_GAS_PRICE),
            value: new BigNumber(CUSTOM_VALUE)
          }
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'ethFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'data',
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'nonce'
        ])
        assert.equal(rawTxObject.rawTx.from, USER_ADDRESS)
        assert.equal(rawTxObject.rawTx.to, CONTRACT_ADDRESS)
        assert.instanceOf(rawTxObject.rawTx.value, BigNumber)
        assert.equal(
          rawTxObject.rawTx.value.toString(),
          CUSTOM_VALUE.toString()
        )
        assert.instanceOf(rawTxObject.rawTx.gasLimit, BigNumber)
        assert.equal(
          rawTxObject.rawTx.gasLimit.toString(),
          CUSTOM_GAS_LIMIT.toString()
        )
        assert.instanceOf(rawTxObject.rawTx.gasPrice, BigNumber)
        assert.equal(
          rawTxObject.rawTx.gasPrice.toString(),
          CUSTOM_GAS_PRICE.toString()
        )
        assert.isNumber(rawTxObject.rawTx.nonce)
        assert.isString(rawTxObject.rawTx.data)
        assert.hasAllKeys(rawTxObject.ethFees, ['decimals', 'raw', 'value'])
        assert.equal(rawTxObject.ethFees.decimals, 18)
        assert.instanceOf(rawTxObject.ethFees.raw, BigNumber)
        assert.instanceOf(rawTxObject.ethFees.value, BigNumber)
      })
    })

    describe('#prepareValueTransaction()', () => {
      it('should prepare a transaction object for transferring eth', async () => {
        const rawTxObject = await transaction.prepareValueTransaction(
          USER_ADDRESS,
          COUNTER_PARTY_ADDRESS,
          new BigNumber('1')
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'ethFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'nonce'
        ])
        assert.equal(rawTxObject.rawTx.from, USER_ADDRESS)
        assert.equal(rawTxObject.rawTx.to, COUNTER_PARTY_ADDRESS)
        assert.instanceOf(rawTxObject.rawTx.value, BigNumber)
        assert.equal(rawTxObject.rawTx.value.toString(), '1')
        assert.instanceOf(rawTxObject.rawTx.gasLimit, BigNumber)
        assert.instanceOf(rawTxObject.rawTx.gasPrice, BigNumber)
        assert.isNumber(rawTxObject.rawTx.nonce)
        assert.hasAllKeys(rawTxObject.ethFees, ['decimals', 'raw', 'value'])
        assert.equal(rawTxObject.ethFees.decimals, 18)
        assert.instanceOf(rawTxObject.ethFees.raw, BigNumber)
        assert.instanceOf(rawTxObject.ethFees.value, BigNumber)
      })

      it('should prepare a transaction object for transferring eth with options', async () => {
        const CUSTOM_GAS_LIMIT = 10000000
        const CUSTOM_GAS_PRICE = 1
        const CUSTOM_VALUE = 123
        const rawTxObject = await transaction.prepareValueTransaction(
          USER_ADDRESS,
          COUNTER_PARTY_ADDRESS,
          new BigNumber(CUSTOM_VALUE),
          {
            gasLimit: new BigNumber(CUSTOM_GAS_LIMIT),
            gasPrice: new BigNumber(CUSTOM_GAS_PRICE)
          }
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'ethFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'nonce'
        ])
        assert.equal(rawTxObject.rawTx.from, USER_ADDRESS)
        assert.equal(rawTxObject.rawTx.to, COUNTER_PARTY_ADDRESS)
        assert.instanceOf(rawTxObject.rawTx.value, BigNumber)
        assert.equal(
          rawTxObject.rawTx.value.toString(),
          CUSTOM_VALUE.toString()
        )
        assert.instanceOf(rawTxObject.rawTx.gasLimit, BigNumber)
        assert.equal(
          rawTxObject.rawTx.gasLimit.toString(),
          CUSTOM_GAS_LIMIT.toString()
        )
        assert.instanceOf(rawTxObject.rawTx.gasPrice, BigNumber)
        assert.equal(
          rawTxObject.rawTx.gasPrice.toString(),
          CUSTOM_GAS_PRICE.toString()
        )
        assert.isNumber(rawTxObject.rawTx.nonce)
        assert.hasAllKeys(rawTxObject.ethFees, ['decimals', 'raw', 'value'])
        assert.equal(rawTxObject.ethFees.decimals, 18)
        assert.instanceOf(rawTxObject.ethFees.raw, BigNumber)
        assert.instanceOf(rawTxObject.ethFees.value, BigNumber)
      })
    })

    describe('#confirm()', () => {
      it('should return transaction hash', async () => {
        const txHash = await transaction.confirm(RAW_TX_OBJECT)
        assert.isString(txHash)
      })
    })
  })
})
