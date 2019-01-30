import { BigNumber } from 'bignumber.js'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'
import { RelaySigner } from '../../src/signers/RelaySigner'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import { USER_1 } from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('RelaySigner', () => {
    // Test object
    let relaySigner: RelaySigner

    // Mock classes
    let fakeTLProvider: TLProvider

    const init = () => {
      fakeTLProvider = new FakeTLProvider()
      relaySigner = new RelaySigner(fakeTLProvider)
    }

    // Constants
    const ACCOUNT_KEYS = ['address', 'keystore', 'pubKey']
    const DEFAULT_PASSWORD = 'ts'

    describe('#createAccount()', () => {
      beforeEach(() => init())

      it('should create account', async () => {
        const createdAccount = await relaySigner.createAccount(DEFAULT_PASSWORD)
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
      })

      it('should create account with progress callback', async () => {
        const createdAccount = await relaySigner.createAccount(
          DEFAULT_PASSWORD,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
      })
    })

    describe('#loadAccount()', () => {
      beforeEach(() => init())

      it('should load account from encrypted json keystore', async () => {
        const loadedAccount = await relaySigner.loadAccount(
          USER_1.keystore,
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(loadedAccount, ACCOUNT_KEYS)
      })

      it('should load account from encrypted json keystore with progress callback', async () => {
        const loadedAccount = await relaySigner.loadAccount(
          USER_1.keystore,
          DEFAULT_PASSWORD,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(loadedAccount, ACCOUNT_KEYS)
        assert.equal(loadedAccount.address, USER_1.address)
        assert.equal(loadedAccount.pubKey, USER_1.pubKey)
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover account from mnemonic', async () => {
        const recoveredAccount = await relaySigner.recoverFromSeed(
          USER_1.mnemonic,
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })

      it('should recover account from mnemonic with progress callback', async () => {
        const recoveredAccount = await relaySigner.recoverFromSeed(
          USER_1.mnemonic,
          DEFAULT_PASSWORD,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })
    })

    describe('#recoverFromPrivateKey()', () => {
      beforeEach(() => init())

      it('should recover account from private key', async () => {
        const recoveredAccount = await relaySigner.recoverFromPrivateKey(
          USER_1.privateKey,
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })

      it('should recover account from private key with progress callback', async () => {
        const recoveredAccount = await relaySigner.recoverFromSeed(
          USER_1.mnemonic,
          DEFAULT_PASSWORD,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })
    })

    describe('#signMessage()', () => {
      const MESSAGE = 'hello world!'

      beforeEach(async () => {
        init()
        await relaySigner.loadAccount(USER_1.keystore, DEFAULT_PASSWORD)
      })

      it('should sign message with correct address', async () => {
        const flatSignature = await relaySigner.signMessage(MESSAGE)
        const signingAddress = ethers.utils.verifyMessage(
          MESSAGE,
          flatSignature
        )
        assert.equal(signingAddress, USER_1.address)
      })
    })

    describe('#signMessage()', () => {
      const MESSAGE = 'hello world!'

      beforeEach(async () => {
        init()
        await relaySigner.loadAccount(USER_1.keystore, DEFAULT_PASSWORD)
      })

      it('should sign message with correct address', async () => {
        const flatSignature = await relaySigner.signMessage(MESSAGE)
        const signingAddress = ethers.utils.verifyMessage(
          MESSAGE,
          flatSignature
        )
        assert.equal(signingAddress, USER_1.address)
      })
    })
  })
})
