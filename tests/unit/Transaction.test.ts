import { BigNumber } from 'bignumber.js'
import { assert } from 'chai'
import 'mocha'

import { Transaction } from '../../src/Transaction'
import { FakeConfiguration } from '../helpers/FakeConfiguration'
import { FakeTxSigner } from '../helpers/FakeTxSigner'
import { FakeUtils } from '../helpers/FakeUtils'

describe('unit', () => {
  describe('Transaction', () => {
    // test object
    let transaction: Transaction

    // mocked tx signer
    let fakeTxSigner
    let fakeUtils

    // test data
    const USER_ADDRESS = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
    const COUNTER_PARTY_ADDRESS = '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18'
    const CONTRACT_ADDRESS = '0xd0a6E6C54DbC68Db5db3A091B171A77407Ff7ccf'
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
      const fakeConfiguration = new FakeConfiguration()
      fakeUtils = new FakeUtils(fakeConfiguration)
      fakeTxSigner = new FakeTxSigner()
      transaction = new Transaction(fakeUtils, fakeTxSigner)
    })

    describe('#prepFuncTx()', () => {
      it('should prepare a transaction object for calling a function', async () => {
        const rawTxObject = await transaction.prepFuncTx(
          USER_ADDRESS,
          CONTRACT_ADDRESS,
          'CurrencyNetwork',
          'transfer',
          [COUNTER_PARTY_ADDRESS, '10000', '0', [COUNTER_PARTY_ADDRESS]]
        )
        assert.hasAllKeys(rawTxObject, ['rawTx', 'ethFees'])
        assert.hasAllKeys(rawTxObject.rawTx, [
          'from',
          'to',
          'value',
          'gasLimit',
          'gasPrice',
          'nonce',
          'functionCallData'
        ])
        assert.equal(rawTxObject.rawTx.from, USER_ADDRESS)
        assert.equal(rawTxObject.rawTx.to, CONTRACT_ADDRESS)
        assert.instanceOf(rawTxObject.rawTx.value, BigNumber)
        assert.equal(rawTxObject.rawTx.value.toString(), '0')
        assert.instanceOf(rawTxObject.rawTx.gasLimit, BigNumber)
        assert.instanceOf(rawTxObject.rawTx.gasPrice, BigNumber)
        assert.isNumber(rawTxObject.rawTx.nonce)
        assert.hasAllKeys(rawTxObject.rawTx.functionCallData, [
          'abi',
          'functionName',
          'args'
        ])
        assert.hasAllKeys(rawTxObject.ethFees, ['decimals', 'raw', 'value'])
        assert.equal(rawTxObject.ethFees.decimals, 18)
        assert.instanceOf(rawTxObject.ethFees.raw, BigNumber)
        assert.instanceOf(rawTxObject.ethFees.value, BigNumber)
      })
    })

    describe('#prepValueTx()', () => {
      it('should prepare a transaction object for transferring eth', async () => {
        const rawTxObject = await transaction.prepValueTx(
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
    })

    describe('#confirm()', () => {
      it('should return transaction hash', async () => {
        const txHash = await transaction.confirm(RAW_TX_OBJECT)
        assert.isString(txHash)
      })
    })

    describe('#getBlockNumber()', () => {
      it('should get block number', async () => {
        const blockNumber = await transaction.getBlockNumber()
        assert.isNumber(blockNumber)
      })
    })
  })
})
