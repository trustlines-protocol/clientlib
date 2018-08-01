import 'mocha'
import { assert } from 'chai'
import { BigNumber } from 'bignumber.js'

import { LightwalletSigner } from '../../src/signers/LightwalletSigner'
import { FakeConfiguration } from '../helpers/FakeConfiguration'
import { FakeUtils } from '../helpers/FakeUtils'

describe('unit', () => {
  describe('LightwalletSigner', () => {
    // test object
    let lightwalletSigner: LightwalletSigner

    // test data
    const USER_ADDRESS = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
    const RAW_TX_OBJECT = {
      from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
      to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
      value: 10000,
      gasLimit: 10000,
      gasPrice: 10000,
      data: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      nonce: 5
    }

    beforeEach(() => {
      const fakeConfiguration = new FakeConfiguration()
      const fakeUtils = new FakeUtils(fakeConfiguration)
      lightwalletSigner = new LightwalletSigner(fakeUtils)
    })

    describe('#getTxInfos()', () => {
      it('should return nonce, gasPrice and balance', async () => {
        const txInfos = await lightwalletSigner.getTxInfos(USER_ADDRESS)
        assert.hasAllKeys(txInfos, ['nonce', 'gasPrice', 'balance'])
        assert.isNumber(txInfos.nonce)
        assert.instanceOf(txInfos.gasPrice, BigNumber)
        assert.instanceOf(txInfos.balance, BigNumber)
      })
    })

    describe('#getBalance()', () => {
      it('should return ETH balance for loaded user', async () => {
        const balance = await lightwalletSigner.getBalance()
        assert.hasAllKeys(balance, ['decimals', 'value', 'raw'])
        assert.isNumber(balance.decimals)
        assert.isString(balance.value)
        assert.isString(balance.raw)
      })
    })
  })
})
