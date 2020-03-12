import { BigNumber } from 'bignumber.js'
import { assert } from 'chai'
import 'mocha'

import { Transaction } from '../../src/Transaction'

import { FakeTLProvider } from '../helpers/FakeTLProvider'
import { FakeTLSigner } from '../helpers/FakeTLSigner'

import { extraData } from '../Fixtures'
import { FakeCurrencyNetwork } from '../helpers/FakeCurrencyNetwork'

import { AmountInternal, DelegationFeesInternal } from '../../src/typings'

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
      const provider = new FakeTLProvider()
      transaction = new Transaction({
        provider,
        signer: new FakeTLSigner(),
        currencyNetwork: new FakeCurrencyNetwork(provider)
      })
    })

    describe('#prepareContractTransaction()', () => {
      it('should prepare a transaction object for calling a function', async () => {
        const rawTxObject = await transaction.prepareContractTransaction(
          USER_ADDRESS,
          CONTRACT_ADDRESS,
          'CurrencyNetwork',
          'transfer',
          ['10000', '0', [USER_ADDRESS, COUNTER_PARTY_ADDRESS], EXTRA_DATA]
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'txFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'data',
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'baseFee',
          'totalFee',
          'feeRecipient',
          'currencyNetworkOfFees',
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
        assert.hasAllKeys(rawTxObject.txFees, [
          'totalFee',
          'baseFee',
          'gasLimit',
          'feeRecipient',
          'currencyNetworkOfFees',
          'gasPrice'
        ])
        assert.equal(rawTxObject.txFees.totalFee.decimals, 18)
        assert.isString(rawTxObject.txFees.totalFee.raw)
        assert.isString(rawTxObject.txFees.totalFee.value)
        assert.isString(rawTxObject.txFees.baseFee.raw)
        assert.isString(rawTxObject.txFees.baseFee.value)
        assert.isString(rawTxObject.txFees.gasPrice.raw)
        assert.isString(rawTxObject.txFees.gasPrice.value)
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
          ['10000', '0', [USER_ADDRESS, COUNTER_PARTY_ADDRESS], EXTRA_DATA],
          {
            gasLimit: new BigNumber(CUSTOM_GAS_LIMIT),
            gasPrice: new BigNumber(CUSTOM_GAS_PRICE),
            value: new BigNumber(CUSTOM_VALUE),
            baseFee: new BigNumber(CUSTOM_VALUE),
            currencyNetworkOfFees: CONTRACT_ADDRESS
          }
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'txFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'data',
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'baseFee',
          'feeRecipient',
          'currencyNetworkOfFees',
          'totalFee',
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
        assert.hasAllKeys(rawTxObject.txFees.totalFee, [
          'decimals',
          'raw',
          'value'
        ])
        assert.equal(
          rawTxObject.txFees.totalFee.decimals,
          2,
          'Should use the decimals of the currency network'
        )
        assert.isString(rawTxObject.txFees.totalFee.raw)
        assert.isString(rawTxObject.txFees.totalFee.value)
        assert.hasAllKeys(rawTxObject.txFees, [
          'baseFee',
          'gasPrice',
          'gasLimit',
          'totalFee',
          'feeRecipient',
          'currencyNetworkOfFees'
        ])
        assert.isString(rawTxObject.txFees.currencyNetworkOfFees)
        assert.equal(rawTxObject.txFees.currencyNetworkOfFees, CONTRACT_ADDRESS)
        assert.isString(rawTxObject.txFees.baseFee.raw)
        assert.isString(rawTxObject.txFees.baseFee.value)
        assert.equal(rawTxObject.txFees.baseFee.raw, CUSTOM_VALUE.toString())
        assert.isString(rawTxObject.txFees.gasPrice.raw)
        assert.isString(rawTxObject.txFees.gasPrice.value)
        assert.equal(
          rawTxObject.txFees.gasPrice.raw,
          CUSTOM_GAS_PRICE.toString()
        )
      })
    })

    describe('#prepareValueTransaction()', () => {
      it('should prepare a transaction object for transferring eth', async () => {
        const rawTxObject = await transaction.prepareValueTransaction(
          USER_ADDRESS,
          COUNTER_PARTY_ADDRESS,
          new BigNumber('1')
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'txFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'baseFee',
          'feeRecipient',
          'currencyNetworkOfFees',
          'totalFee',
          'nonce'
        ])
        assert.equal(rawTxObject.rawTx.from, USER_ADDRESS)
        assert.equal(rawTxObject.rawTx.to, COUNTER_PARTY_ADDRESS)
        assert.instanceOf(rawTxObject.rawTx.value, BigNumber)
        assert.equal(rawTxObject.rawTx.value.toString(), '1')
        assert.instanceOf(rawTxObject.rawTx.gasLimit, BigNumber)
        assert.instanceOf(rawTxObject.rawTx.gasPrice, BigNumber)
        assert.isNumber(rawTxObject.rawTx.nonce)
        assert.hasAllKeys(rawTxObject.txFees, [
          'totalFee',
          'baseFee',
          'feeRecipient',
          'currencyNetworkOfFees',
          'gasLimit',
          'gasPrice'
        ])
        assert.equal(rawTxObject.txFees.totalFee.decimals, 18)
        assert.isString(rawTxObject.txFees.totalFee.raw)
        assert.isString(rawTxObject.txFees.totalFee.value)
        assert.isString(rawTxObject.txFees.baseFee.raw)
        assert.isString(rawTxObject.txFees.baseFee.value)
        assert.isString(rawTxObject.txFees.gasPrice.raw)
        assert.isString(rawTxObject.txFees.gasPrice.value)
      })

      it('should prepare a transaction object for transferring eth with options', async () => {
        const CUSTOM_GAS_LIMIT = 10000000
        const CUSTOM_GAS_PRICE = 1
        const CUSTOM_VALUE = 123
        const CUSTOM_DELEGATION_FEES = {
          baseFee: new BigNumber(CUSTOM_VALUE),
          gasPrice: new BigNumber(CUSTOM_GAS_PRICE),
          currencyNetworkOfFees: CONTRACT_ADDRESS
        }
        const rawTxObject = await transaction.prepareValueTransaction(
          USER_ADDRESS,
          COUNTER_PARTY_ADDRESS,
          new BigNumber(CUSTOM_VALUE),
          {
            gasLimit: new BigNumber(CUSTOM_GAS_LIMIT),
            gasPrice: new BigNumber(CUSTOM_GAS_PRICE),
            baseFee: new BigNumber(CUSTOM_VALUE),
            currencyNetworkOfFees: CONTRACT_ADDRESS
          }
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'txFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'baseFee',
          'feeRecipient',
          'currencyNetworkOfFees',
          'totalFee',
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
        assert.hasAllKeys(rawTxObject.txFees.totalFee, [
          'decimals',
          'raw',
          'value'
        ])
        assert.equal(
          rawTxObject.txFees.totalFee.decimals,
          2,
          'Should use the decimals of the currency network'
        )
        assert.isString(rawTxObject.txFees.totalFee.raw)
        assert.isString(rawTxObject.txFees.totalFee.value)
        assert.hasAllKeys(rawTxObject.txFees, [
          'baseFee',
          'gasPrice',
          'gasLimit',
          'totalFee',
          'feeRecipient',
          'currencyNetworkOfFees'
        ])
        assert.isString(rawTxObject.txFees.currencyNetworkOfFees)
        assert.equal(rawTxObject.txFees.currencyNetworkOfFees, CONTRACT_ADDRESS)
        assert.isString(rawTxObject.txFees.baseFee.raw)
        assert.isString(rawTxObject.txFees.baseFee.value)
        assert.equal(rawTxObject.txFees.baseFee.raw, CUSTOM_VALUE.toString())
        assert.isString(rawTxObject.txFees.gasPrice.raw)
        assert.isString(rawTxObject.txFees.gasPrice.value)
        assert.equal(
          rawTxObject.txFees.gasPrice.raw,
          CUSTOM_GAS_PRICE.toString()
        )
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
