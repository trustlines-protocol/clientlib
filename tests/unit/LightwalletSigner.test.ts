import 'mocha'
import { assert } from 'chai'
import { BigNumber } from 'bignumber.js'

import { LightwalletSigner } from '../../src/signers/LightwalletSigner'
import { FakeConfiguration } from '../helpers/FakeConfiguration'
import { FakeUtils } from '../helpers/FakeUtils'
import { FakeEthLightwallet } from '../helpers/FakeEthLightwallet'

import { keystore1, keystore2, user1 } from '../Fixtures'

describe('unit', () => {
  describe('LightwalletSigner', () => {
    // mocks
    const fakeConfiguration = new FakeConfiguration()
    const fakeUtils = new FakeUtils(fakeConfiguration)

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

    describe('#createAccount()', () => {
      const fakeEthLightwallet = new FakeEthLightwallet()
      const lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)

      afterEach(() => {
        lightwalletSigner.keystore.removeErrors()
      })

      it('should create account using mocked eth-lightwallet', async () => {
        const createdAccount = await lightwalletSigner.createAccount()
        assert.hasAllKeys(createdAccount, ['address', 'keystore', 'pubKey'])
        assert.isString(createdAccount.address)
        assert.isString(createdAccount.keystore)
        assert.isString(createdAccount.address)
      })

      it('should throw error for lightwallet.keystore.createVault()', async () => {
        lightwalletSigner.keystore.setError('createVault')
        await assert.isRejected(lightwalletSigner.createAccount())
      })

      it('should throw error for lightwallet.keystore.generateRandomSeed()', async () => {
        // lightwalletSigner.keystore.setError('generateRandomSeed')
        await assert.isRejected(lightwalletSigner.createAccount())
      })

      it('should throw error for lightwallet.keystore.keyFromPassword()', async () => {
        lightwalletSigner.keystore.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.createAccount())
      })

      it('should throw error for lightwallet.keystore.generateNewAddress()', async () => {
        lightwalletSigner.keystore.setError('generateNewAddress')
        await assert.isRejected(lightwalletSigner.createAccount())
      })

      it('should throw error for lightwallet.keystore.addressToPublicEncKey()', async () => {
        lightwalletSigner.keystore.setError('addressToPublicEncKey')
        await assert.isRejected(lightwalletSigner.createAccount())
      })
    })

    describe('#loadAccount()', () => {
      const fakeEthLightwallet = new FakeEthLightwallet()
      const lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)

      afterEach(() => {
        lightwalletSigner.keystore.removeErrors()
      })

      it('should load keystore using mocked eth-lightwallet', async () => {
        const loadedAccount = await lightwalletSigner.loadAccount(keystore1)
        assert.hasAllKeys(loadedAccount, ['address', 'keystore', 'pubKey'])
        assert.isString(loadedAccount.address)
        assert.isString(loadedAccount.keystore)
        assert.isString(loadedAccount.address)
      })

      it('should load and upgrade old keystore using mocked eth-lightwallet', async () => {
        const loadedAccount = await lightwalletSigner.loadAccount(keystore2)
        assert.hasAllKeys(loadedAccount, ['address', 'keystore', 'pubKey'])
        assert.isString(loadedAccount.address)
        assert.isString(loadedAccount.keystore)
        assert.isString(loadedAccount.address)
      })

      it('should throw error for lightwallet.update.upgradeOldSerialized()', async () => {
        lightwalletSigner.keystore.setError('upgradeOldSerialized')
        await assert.isRejected(lightwalletSigner.loadAccount(keystore2))
      })

      it('should throw error for lightwallet.keystore.keyFromPassword()', async () => {
        lightwalletSigner.keystore.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.loadAccount(keystore1))
      })

      it('should throw error for lightwallet.keystore.generateNewAddress()', async () => {
        lightwalletSigner.keystore.setError('generateNewAddress')
        await assert.isRejected(lightwalletSigner.loadAccount(keystore1))
      })

      it('should throw error for lightwallet.keystore.addressToPublicEncKey()', async () => {
        lightwalletSigner.keystore.setError('addressToPublicEncKey')
        await assert.isRejected(lightwalletSigner.loadAccount(keystore1))
      })
    })

    describe('#signMsgHash()', () => {
      const fakeEthLightwallet = new FakeEthLightwallet()
      const lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)

      before(async () => {
        await lightwalletSigner.loadAccount(keystore1)
      })

      beforeEach(() => {
        lightwalletSigner.keystore.removeErrors()
      })

      it('should sign message hash using mocked eth-lightwallet', async () => {
        const signature = await lightwalletSigner.signMsgHash(
          '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2'
        )
        assert.hasAllKeys(signature, ['ecSignature', 'concatSig'])
        assert.hasAllKeys(signature.ecSignature, ['r', 's', 'v'])
        assert.isString(signature.ecSignature.r)
        assert.isString(signature.ecSignature.s)
        assert.isNumber(signature.ecSignature.v)
      })

      it('should throw error for lightwallet.keystore.keyFromPassword()', async () => {
        lightwalletSigner.keystore.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.signMsgHash(
          '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2'
        ))
      })

      it('should throw error for lightwallet.signing.signMsgHash()', async () => {
        lightwalletSigner.keystore.setError('signMsgHash')
        await assert.isRejected(lightwalletSigner.signMsgHash(
          '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2'
        ))
      })
    })

    describe('#getBalance()', () => {
      const fakeEthLightwallet = new FakeEthLightwallet()
      const lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)

      it('should return ETH balance for loaded user', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        const balance = await lightwalletSigner.getBalance()
        assert.hasAllKeys(balance, ['decimals', 'value', 'raw'])
        assert.isNumber(balance.decimals)
        assert.isString(balance.value)
        assert.isString(balance.raw)
      })

      it('should throw error because there is no loaded user', async () => {
        const lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
        await assert.isRejected(lightwalletSigner.getBalance())
      })
    })

    describe('#encrypt()', () => {
      const fakeEthLightwallet = new FakeEthLightwallet()
      const lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)

      before(async () => {
        await lightwalletSigner.loadAccount(keystore1)
      })

      beforeEach(() => {
        lightwalletSigner.keystore.removeErrors()
      })

      it('should return encryption object using mocked eth-lightwallet', async () => {
        const encObj = await lightwalletSigner.encrypt('hello world!', user1.pubKey)
        assert.hasAllKeys(encObj, [
          'version',
          'asymAlg',
          'symAlg',
          'symNonce',
          'symEncMessage',
          'encryptedSymKey'
        ])
      })
    })

    describe('#getTxInfos()', () => {
      const fakeEthLightwallet = new FakeEthLightwallet()
      const lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)

      it('should return nonce, gasPrice and balance', async () => {
        const txInfos = await lightwalletSigner.getTxInfos(USER_ADDRESS)
        assert.hasAllKeys(txInfos, ['nonce', 'gasPrice', 'balance'])
        assert.isNumber(txInfos.nonce)
        assert.instanceOf(txInfos.gasPrice, BigNumber)
        assert.instanceOf(txInfos.balance, BigNumber)
      })
    })

  })
})
