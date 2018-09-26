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
    let fakeEthLightwallet
    let lightwalletSigner

    // test data
    const USER_ADDRESS = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
    const RAW_TX_OBJECT = {
      from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
      value: 10000,
      gasLimit: 10000,
      gasPrice: 10000,
      nonce: 5
    }
    const RAW_VALUE_TX_OBJECT = {
      ...RAW_TX_OBJECT,
      to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
    }
    const RAW_FUNCTION_TX_OBJECT = {
      ...RAW_TX_OBJECT,
      functionCallData: {
        abi: {
          'type': 'function',
          'inputs': [
            {
              'name': 'a',
              'type': 'uint256'
            }
          ],
          'name': 'foo',
          'outputs': []
        },
        functionName: 'foo',
        args: [ 123445 ]
      }
    }

    describe('#createAccount()', () => {
      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should create account using mocked eth-lightwallet', async () => {
        const createdAccount = await lightwalletSigner.createAccount()
        assert.hasAllKeys(createdAccount, ['address', 'keystore', 'pubKey'])
        assert.isString(createdAccount.address)
        assert.isString(createdAccount.keystore)
        assert.isString(createdAccount.pubKey)
      })

      it('should throw error for lightwallet.keystore.createVault()', async () => {
        fakeEthLightwallet.setError('createVault')
        await assert.isRejected(lightwalletSigner.createAccount())
      })

      it('should throw error for lightwallet.keystore.generateRandomSeed()', async () => {
        fakeEthLightwallet.setError('generateRandomSeed')
        await assert.isRejected(lightwalletSigner.createAccount())
      })

      it('should throw error for lightwallet.keystore.keyFromPassword()', async () => {
        fakeEthLightwallet.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.createAccount())
      })

      it('should throw error for lightwallet.keystore.generateNewAddress()', async () => {
        fakeEthLightwallet.setError('generateNewAddress')
        await assert.isRejected(lightwalletSigner.createAccount())
      })

      it('should throw error for lightwallet.keystore.addressToPublicEncKey()', async () => {
        fakeEthLightwallet.setError('addressToPublicEncKey')
        await assert.isRejected(lightwalletSigner.createAccount())
      })
    })

    describe('#loadAccount()', () => {
      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
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
        fakeEthLightwallet.setError('upgradeOldSerialized')
        await assert.isRejected(lightwalletSigner.loadAccount(keystore2))
      })

      it('should throw error for lightwallet.keystore.keyFromPassword()', async () => {
        fakeEthLightwallet.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.loadAccount(keystore1))
      })

      it('should throw error for lightwallet.keystore.generateNewAddress()', async () => {
        fakeEthLightwallet.setError('generateNewAddress')
        await assert.isRejected(lightwalletSigner.loadAccount(keystore1))
      })

      it('should throw error for lightwallet.keystore.addressToPublicEncKey()', async () => {
        fakeEthLightwallet.setError('addressToPublicEncKey')
        await assert.isRejected(lightwalletSigner.loadAccount(keystore1))
      })
    })

    describe('#signMsgHash()', () => {
      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should sign message hash using mocked eth-lightwallet', async () => {
        await lightwalletSigner.loadAccount(keystore1)
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
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.signMsgHash(
          '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2'
        ))
      })

      it('should throw error for lightwallet.signing.signMsgHash()', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('signMsgHash')
        await assert.isRejected(lightwalletSigner.signMsgHash(
          '0xa1de988600a42c4b4ab089b619297c17d53cffae5d5120d82d8a92d0bb3b78f2'
        ))
      })
    })

    describe('#getBalance()', () => {
      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should return ETH balance for loaded user', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        const balance = await lightwalletSigner.getBalance()
        assert.hasAllKeys(balance, ['decimals', 'value', 'raw'])
        assert.isNumber(balance.decimals)
        assert.isString(balance.value)
        assert.isString(balance.raw)
      })

      it('should throw error because there is no loaded user', async () => {
        await assert.isRejected(lightwalletSigner.getBalance())
      })
    })

    describe('#encrypt()', () => {
      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should return encryption object using mocked eth-lightwallet', async () => {
        await lightwalletSigner.loadAccount(keystore1)
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

      it('should throw error because there is no loaded user', async () => {
        // NOTE: No idea why `await assert.isRejected(...)` is not working here
        try {
          await lightwalletSigner.encrypt('hello world!', user1.pubKey)
        } catch (error) {
          assert.equal(error.message, 'No account/keystore loaded.')
          return
        }
      })

      it('should throw error for lightwallet.keystore.keyFromPassword', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.encrypt('hello world!', user1.pubKey))
      })

      it('should throw error for lightwallet.encryption.multiEncryptString', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('multiEncryptString')
        await assert.isRejected(lightwalletSigner.encrypt('hello world!', user1.pubKey))
      })
    })

    describe('#decrypt()', () => {
      const ENC_MSG = {
        version: 1,
        asymAlg: 'Asym Algorithm',
        symAlg: 'Sym Algorithm',
        symNonce: 'Sym Nonce',
        symEncMessage: 'Encrypted Message',
        encryptedSymKey: 'Encrypted Symmetric Key'
      }

      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should decrypt message using mocked eth-lightwallet', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        const decryptedMsg = await lightwalletSigner.decrypt(ENC_MSG, user1.pubKey)
        assert.equal(decryptedMsg, 'Decrypted Message!')
      })

      it('should throw error because there is no loaded user', async () => {
        // NOTE: No idea why `await assert.isRejected(...)` is not working here
        try {
          await lightwalletSigner.decrypt(ENC_MSG, user1.pubKey)
        } catch (error) {
          assert.equal(error.message, 'No account/keystore loaded.')
          return
        }
      })

      it('should throw error for lightwallet.keystore.keyFromPassword', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.decrypt(ENC_MSG, user1.pubKey))
      })

      it('should throw error for lightwallet.encryption.multiDecryptString', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('multiDecryptString')
        await assert.isRejected(lightwalletSigner.decrypt(ENC_MSG, user1.pubKey))
      })
    })

    describe('#showSeed()', () => {
      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should show seed for loaded user', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        const seed = await lightwalletSigner.showSeed()
        assert.equal(seed, 'mesh park casual casino sorry giraffe half shrug wool anger chef amateur')
      })

      it('should throw error because there is no loaded user', async () => {
        // NOTE: No idea why `await assert.isRejected(...)` is not working here
        try {
          await await lightwalletSigner.showSeed()
        } catch (error) {
          assert.equal(error.message, 'No account/keystore loaded.')
          return
        }
      })

      it('should throw error for lightwallet.keystore.keyFromPassword', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.showSeed())
      })

      it('should throw error for lightwallet.keystore.getSeed', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('getSeed')
        await assert.isRejected(lightwalletSigner.showSeed())
      })
    })

    describe('#exportPrivateKey()', () => {
      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should return private key of loaded user', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        const privateKey = await lightwalletSigner.exportPrivateKey()
        // NOTE: Mocked private key from FakeEthLightwallet.ts
        assert.equal(privateKey, '3a1076bf45ab87712ad64ccb3b10217737f7faacbf2872e88fdd9a537d8fe266')
      })

      it('should throw error because there is no loaded user', async () => {
        // NOTE: No idea why `await assert.isRejected(...)` is not working here
        try {
          await lightwalletSigner.exportPrivateKey()
        } catch (error) {
          assert.equal(error.message, 'No account/keystore loaded.')
          return
        }
      })

      it('should throw error for lightwallet.keystore.keyFromPassword', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.exportPrivateKey())
      })

      it('should throw error for lightwallet.keystore.exportPrivateKey', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('exportPrivateKey')
        await assert.isRejected(lightwalletSigner.exportPrivateKey())
      })
    })

    describe('#recoverFromSeed()', () => {
      const seed = 'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'

      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should recover account from seed and return it', async () => {
        const recoveredAccount = await lightwalletSigner.recoverFromSeed(seed)
        assert.hasAllKeys(recoveredAccount, ['address', 'keystore', 'pubKey'])
        assert.isString(recoveredAccount.address)
        assert.isString(recoveredAccount.keystore)
        assert.isString(recoveredAccount.pubKey)
      })

      it('should throw error for lightwallet.keystore.createVault()', async () => {
        fakeEthLightwallet.setError('createVault')
        await assert.isRejected(lightwalletSigner.recoverFromSeed(seed))
      })

      it('should throw error for lightwallet.keystore.keyFromPassword()', async () => {
        fakeEthLightwallet.setError('keyFromPassword')
        await assert.isRejected(lightwalletSigner.recoverFromSeed(seed))
      })

      it('should throw error for lightwallet.keystore.generateNewAddress()', async () => {
        fakeEthLightwallet.setError('generateNewAddress')
        await assert.isRejected(lightwalletSigner.recoverFromSeed(seed))
      })

      it('should throw error for lightwallet.keystore.addressToPublicEncKey()', async () => {
        fakeEthLightwallet.setError('addressToPublicEncKey')
        await assert.isRejected(lightwalletSigner.recoverFromSeed(seed))
      })
    })

    describe('#confirm()', () => {
      beforeEach(() => {
        fakeEthLightwallet = new FakeEthLightwallet()
        lightwalletSigner = new LightwalletSigner(fakeEthLightwallet, fakeUtils)
      })

      it('should sign and relay a value transaction object and return the transaction hash', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        const txId = await lightwalletSigner.confirm(RAW_VALUE_TX_OBJECT)
        assert.isString(txId)
      })

      it('should sign and relay a function transaction object and return the transaction hash', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        const txId = await lightwalletSigner.confirm(RAW_FUNCTION_TX_OBJECT)
        assert.isString(txId)
      })

      it('should throw error for lightwallet.signing.valueTx()', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('valueTx')
        await assert.isRejected(lightwalletSigner.confirm(RAW_VALUE_TX_OBJECT))
      })

      it('should throw error for lightwallet.signing.functionTx()', async () => {
        await lightwalletSigner.loadAccount(keystore1)
        fakeEthLightwallet.setError('functionTx')
        await assert.isRejected(lightwalletSigner.confirm(RAW_FUNCTION_TX_OBJECT))
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
