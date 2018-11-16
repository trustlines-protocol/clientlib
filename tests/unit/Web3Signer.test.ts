import 'mocha'
import { assert } from 'chai'
import { Web3Signer } from '../../src/signers/Web3Signer'
import { FakeWeb3Provider } from '../helpers/FakeWeb3Provider'
import { BigNumber } from 'bignumber.js'

describe('unit', () => {
  describe('Web3Signer', () => {
    // test object
    let web3Signer: Web3Signer

    // mocked web3 provider
    let fakeWeb3Provider

    // test data
    const USER_ADDRESS = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
    const RAW_TX_OBJECT = {
      from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
      to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
      value: 10000,
      gasLimit: 10000,
      gasPrice: 10000,
      data:
        '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      nonce: 5
    }

    beforeEach(() => {
      fakeWeb3Provider = new FakeWeb3Provider()
      web3Signer = new Web3Signer(fakeWeb3Provider)
    })

    describe('#getTxInfos()', () => {
      it('should return nonce, gasPrice and balance', async () => {
        const txInfos = await web3Signer.getTxInfos(USER_ADDRESS)
        assert.hasAllKeys(txInfos, ['nonce', 'gasPrice', 'balance'])
        assert.isNumber(txInfos.nonce)
        assert.instanceOf(txInfos.gasPrice, BigNumber)
        assert.instanceOf(txInfos.balance, BigNumber)
      })
    })

    describe('#confirm()', () => {
      it('should return transaction hash', async () => {
        const transactionHash = await web3Signer.confirm(RAW_TX_OBJECT)
        assert.isString(transactionHash)
      })
    })
  })
})
