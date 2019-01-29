import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { User } from '../../src/User'

import { FakeTransaction } from '../helpers/FakeTransaction'
import { FakeTxSigner } from '../helpers/FakeTxSigner'
import { FakeUtils } from '../helpers/FakeUtils'

import {
  FAKE_ACCOUNT,
  FAKE_ENC_OBJECT,
  FAKE_RELAY_API,
  FAKE_SEED,
  FAKE_VALUE_TX_OBJECT_INTERNAL,
  keystore1
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('User', () => {
    // Test object
    let user

    // Mocked classes
    let fakeTxSigner
    let fakeTransaction
    let fakeUtils

    const init = () => {
      fakeTxSigner = new FakeTxSigner()
      fakeUtils = new FakeUtils()
      fakeTransaction = new FakeTransaction(
        fakeUtils,
        fakeTxSigner,
        FAKE_RELAY_API
      )
      user = new User(fakeTxSigner, fakeTransaction, fakeUtils, FAKE_RELAY_API)
    }

    describe('#constructor()', () => {
      beforeEach(() => init())

      it('should construct a User instance', () => {
        user = new User(
          fakeTxSigner,
          fakeTransaction,
          fakeUtils,
          FAKE_RELAY_API
        )
        assert.isString(user.address)
        assert.isString(user.pubKey)
      })
    })

    describe('#create()', () => {
      beforeEach(() => init())

      it('should create a new user', async () => {
        const createdUser = await user.create()
        assert.hasAllKeys(createdUser, ['address', 'keystore', 'pubKey'])
        assert.isString(createdUser.address)
        assert.isString(createdUser.keystore)
        assert.isString(createdUser.pubKey)
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('createAccount')
        await assert.isRejected(user.create())
      })
    })

    describe('#load()', () => {
      beforeEach(() => init())

      it('should load a user from keystore', async () => {
        const loadedUser = await user.load(keystore1)
        assert.hasAllKeys(loadedUser, ['address', 'keystore', 'pubKey'])
        assert.isString(loadedUser.address)
        assert.isString(loadedUser.keystore)
        assert.isString(loadedUser.pubKey)
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('loadAccount')
        await assert.isRejected(user.load(keystore1))
      })
    })

    describe('#signMsgHash()', () => {
      beforeEach(() => init())

      it('should digitally sign message hash', async () => {
        const signature = await user.signMsgHash('hello world!')
        assert.hasAllKeys(signature, ['ecSignature', 'concatSig'])
        assert.hasAllKeys(signature.ecSignature, ['r', 's', 'v'])
        assert.isString(signature.concatSig)
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('signMsgHash')
        await assert.isRejected(user.signMsgHash('hello world!'))
      })
    })

    describe('#getBalance()', () => {
      beforeEach(() => init())

      it('should return balance as amount', async () => {
        const balance = await user.getBalance()
        assert.hasAllKeys(balance, ['decimals', 'raw', 'value'])
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('getBalance')
        await assert.isRejected(user.getBalance())
      })
    })

    describe('#encrypt()', () => {
      beforeEach(() => init())

      it('should return encrypted message as object', async () => {
        const encMsg = await user.encrypt('hello world!')
        assert.hasAllKeys(encMsg, [
          'asymAlg',
          'encryptedSymKey',
          'symAlg',
          'symEncMessage',
          'symNonce',
          'version'
        ])
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('getBalance')
        await assert.isRejected(user.getBalance())
      })
    })

    describe('#decrypt()', () => {
      beforeEach(() => init())

      it('should return decrypted message', async () => {
        const decryptedMsg = await user.decrypt(FAKE_ENC_OBJECT)
        assert.isString(decryptedMsg)
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('decrypt')
        await assert.isRejected(user.decrypt(FAKE_ENC_OBJECT))
      })
    })

    describe('#showSeed()', () => {
      beforeEach(() => init())

      it('should return seed as string', async () => {
        const seed = await user.showSeed()
        assert.equal(seed.split(' ').length, 12)
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('showSeed')
        await assert.isRejected(user.showSeed())
      })
    })

    describe('#exportPrivateKey()', () => {
      beforeEach(() => init())

      it('should return private key', async () => {
        const privateKey = await user.exportPrivateKey()
        assert.isString(privateKey)
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('exportPrivateKey')
        await assert.isRejected(user.exportPrivateKey())
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover user from seed', async () => {
        const recoveredUser = await user.recoverFromSeed(FAKE_SEED)
        assert.hasAllKeys(recoveredUser, ['address', 'keystore', 'pubKey'])
      })

      it('should throw error', async () => {
        fakeTxSigner.setError('recoverFromSeed')
        await assert.isRejected(user.recoverFromSeed())
      })
    })

    describe('#createOnboardingMsg()', () => {
      beforeEach(() => init())

      it('should create onboarding message', async () => {
        const onboardingMsg = await user.createOnboardingMsg(
          'testname',
          keystore1
        )
        assert.isString(onboardingMsg)
      })
    })

    describe('#prepOnboarding()', () => {
      beforeEach(() => init())

      it('should prepare a onboarding transaction', async () => {
        const preparedOnboardingTx = await user.prepOnboarding(
          FAKE_ACCOUNT.address,
          1.23
        )
        assert.hasAllKeys(preparedOnboardingTx, ['rawTx', 'ethFees'])
      })

      it('should throw error', async () => {
        fakeTransaction.setError('prepValueTx')
        await assert.isRejected(user.prepOnboarding(FAKE_ACCOUNT.address, 1.23))
      })
    })

    describe('#confirmOnboarding()', () => {
      beforeEach(() => init())

      it('should confirm prepared onboarding transaction', async () => {
        const txHash = await user.confirmOnboarding(
          FAKE_VALUE_TX_OBJECT_INTERNAL.rawTx
        )
        assert.isString(txHash)
      })

      it('should throw error', async () => {
        fakeTransaction.setError('confirm')
        await assert.isRejected(
          user.confirmOnboarding(FAKE_VALUE_TX_OBJECT_INTERNAL.rawTx)
        )
      })
    })

    describe('#createLink()', () => {
      beforeEach(() => init())

      it('should return a string', async () => {
        const contactLink = await user.createLink('testname')
        assert.isString(contactLink)
      })
    })

    describe('#requestEth()', () => {
      beforeEach(() => init())

      it('should return tx hash', async () => {
        const txHash = await user.requestEth()
        assert.isString(txHash)
      })
    })
  })
})
