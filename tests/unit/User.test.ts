import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { User } from '../../src/User'

import { FakeTLProvider } from '../helpers/FakeTLProvider'
import { FakeTLSigner } from '../helpers/FakeTLSigner'
import { FakeTLWallet } from '../helpers/FakeTLWallet'
import { FakeTransaction } from '../helpers/FakeTransaction'

import {
  FAKE_ACCOUNT,
  FAKE_ENC_OBJECT,
  FAKE_SEED,
  FAKE_VALUE_TX_OBJECT_INTERNAL,
  keystore1
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('User', () => {
    // Test object
    let user: User

    // Mocked classes
    let fakeTLProvider
    let fakeTLWallet
    let fakeTLSigner
    let fakeTransaction

    const init = () => {
      fakeTLProvider = new FakeTLProvider()
      fakeTLWallet = new FakeTLWallet()
      fakeTLSigner = new FakeTLSigner()
      fakeTransaction = new FakeTransaction({
        provider: fakeTLProvider,
        signer: fakeTLWallet
      })
      user = new User({
        provider: fakeTLProvider,
        signer: fakeTLSigner,
        transaction: fakeTransaction,
        wallet: fakeTLWallet
      })
    }

    describe('#constructor()', () => {
      beforeEach(() => init())

      it('should construct a User instance', () => {
        user = new User({
          provider: fakeTLProvider,
          signer: fakeTLSigner,
          transaction: fakeTransaction,
          wallet: fakeTLWallet
        })
        assert.isString(user.address)
        assert.isString(user.pubKey)
      })
    })

    describe('#create()', () => {
      beforeEach(() => init())

      it('should create a new user', async () => {
        const createdUser = await user.create()
        assert.hasAllKeys(createdUser, [
          'address',
          'serializedWallet',
          'pubKey'
        ])
        assert.isString(createdUser.address)
        assert.isString(createdUser.serializedWallet)
        assert.isString(createdUser.pubKey)
      })

      it('should throw error', async () => {
        fakeTLWallet.setError('createAccount')
        await assert.isRejected(user.create())
      })
    })

    describe('#load()', () => {
      beforeEach(() => init())

      it('should load a user from serialized wallet', async () => {
        const loadedUser = await user.load(keystore1)
        assert.hasAllKeys(loadedUser, ['address', 'serializedWallet', 'pubKey'])
        assert.isString(loadedUser.address)
        assert.isString(loadedUser.serializedWallet)
        assert.isString(loadedUser.pubKey)
      })

      it('should throw error', async () => {
        fakeTLWallet.setError('loadAccount')
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
        fakeTLSigner.setError('signMsgHash')
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
        fakeTLSigner.setError('getBalance')
        await assert.isRejected(user.getBalance())
      })
    })

    describe('#encrypt()', () => {
      beforeEach(() => init())

      it('should return encrypted message as object', async () => {
        const encMsg = await user.encrypt('hello world!', 'pubKey')
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
        fakeTLWallet.setError('encrypt')
        await assert.isRejected(user.encrypt('hello world!', 'pubKey'))
      })
    })

    describe('#decrypt()', () => {
      beforeEach(() => init())

      it('should return decrypted message', async () => {
        const decryptedMsg = await user.decrypt(FAKE_ENC_OBJECT, 'pubKey')
        assert.isString(decryptedMsg)
      })

      it('should throw error', async () => {
        fakeTLWallet.setError('decrypt')
        await assert.isRejected(user.decrypt(FAKE_ENC_OBJECT, 'pubKey'))
      })
    })

    describe('#showSeed()', () => {
      beforeEach(() => init())

      it('should return seed as string', async () => {
        const seed = await user.showSeed()
        assert.equal(seed.split(' ').length, 12)
      })

      it('should throw error', async () => {
        fakeTLWallet.setError('showSeed')
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
        fakeTLWallet.setError('exportPrivateKey')
        await assert.isRejected(user.exportPrivateKey())
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover user from seed', async () => {
        const recoveredUser = await user.recoverFromSeed(FAKE_SEED)
        assert.hasAllKeys(recoveredUser, [
          'address',
          'serializedWallet',
          'pubKey'
        ])
      })

      it('should throw error', async () => {
        fakeTLWallet.setError('recoverFromSeed')
        await assert.isRejected(user.recoverFromSeed(FAKE_SEED))
      })
    })

    describe('#createOnboardingMsg()', () => {
      beforeEach(() => init())

      it('should create onboarding message', async () => {
        const onboardingMsg = await user.createOnboardingMsg('testname')
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
