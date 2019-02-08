import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { Web3Wallet } from '../../src/signers/Web3Wallet'
import { FakeWeb3Provider } from '../helpers/FakeWeb3Provider'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('Web3Wallet', () => {
    // test object
    let web3Wallet: Web3Wallet

    // mocked web3 provider
    let fakeWeb3Provider

    // test data
    const USER_ADDRESS = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
    const RAW_TX_OBJECT = {
      data:
        '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
      from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
      gasLimit: 10000,
      gasPrice: 10000,
      nonce: 5,
      to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
      value: 10000
    }
    const RAW_FUNCTION_TX_OBJECT = {
      ...RAW_TX_OBJECT,
      functionCallData: {
        abi: [
          {
            inputs: [
              {
                name: 'a',
                type: 'uint256'
              }
            ],
            name: 'foo',
            outputs: [],
            type: 'function'
          },
          {
            inputs: [
              {
                name: 'a',
                type: 'uint256'
              }
            ],
            name: 'foo2',
            outputs: [],
            type: 'function'
          }
        ],
        args: [123445],
        functionName: 'foo'
      }
    }

    beforeEach(() => {
      fakeWeb3Provider = new FakeWeb3Provider()
      web3Wallet = new Web3Wallet(fakeWeb3Provider)
    })

    describe('#getTxInfos()', () => {
      it('should return nonce, gasPrice and balance', async () => {
        const txInfos = await web3Wallet.getTxInfos(USER_ADDRESS)
        assert.hasAllKeys(txInfos, ['nonce', 'gasPrice', 'balance'])
        assert.isNumber(txInfos.nonce)
        assert.instanceOf(txInfos.gasPrice, BigNumber)
        assert.instanceOf(txInfos.balance, BigNumber)
      })
    })

    describe('#confirm()', () => {
      it('should return transaction hash', async () => {
        const transactionHash = await web3Wallet.confirm(RAW_TX_OBJECT)
        assert.isString(transactionHash)
      })

      it('should return transaction hash for raw function tx', async () => {
        const transactionHash = await web3Wallet.confirm(RAW_FUNCTION_TX_OBJECT)
        assert.isString(transactionHash)
      })
    })

    describe('#createAccount()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.createAccount())
      })
    })

    describe('#loadAccount()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.loadAccount())
      })
    })

    describe('#signMsgHash()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.signMsgHash())
      })
    })

    describe('#getBalance()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.getBalance())
      })
    })

    describe('#encrypt()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.encrypt())
      })
    })

    describe('#decrypt()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.decrypt())
      })
    })

    describe('#showSeed()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.showSeed())
      })
    })

    describe('#recoverFromSeed()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.recoverFromSeed())
      })
    })

    describe('#exportPrivateKey()', () => {
      it('should throw error', async () => {
        await assert.isRejected(web3Wallet.exportPrivateKey())
      })
    })
  })
})
