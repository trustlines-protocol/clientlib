import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import { FAKE_IDENTITY, USER_1 } from '../Fixtures'

import { IdentityWallet } from '../../src/wallets/IdentityWallet'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('IdentityWallet', () => {
    // Test object
    let identityWallet: IdentityWallet

    // Mock classes
    let fakeTLProvider: TLProvider

    const init = () => {
      fakeTLProvider = new FakeTLProvider()
      identityWallet = new IdentityWallet(fakeTLProvider)
    }

    // Constants
    const ACCOUNT_KEYS = ['address', 'keystore', 'pubKey']
    const DEFAULT_PASSWORD = 'ts'
    const IDENTITY_ADDRESS = FAKE_IDENTITY.identity

    describe('#createAccount()', () => {
      beforeEach(() => init())

      it('should create account', async () => {
        const createdAccount = await identityWallet.createAccount(
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
      })

      it('should create account with progress callback', async () => {
        const createdAccount = await identityWallet.createAccount(
          DEFAULT_PASSWORD,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
      })
    })

    describe('#loadAccount()', () => {
      beforeEach(() => init())

      it('should load account from encrypted json keystore', async () => {
        const loadedAccount = await identityWallet.loadAccount(
          USER_1.keystore,
          DEFAULT_PASSWORD,
          IDENTITY_ADDRESS
        )
        assert.hasAllKeys(loadedAccount, ACCOUNT_KEYS)
      })

      it('should load account from encrypted json keystore with progress callback', async () => {
        const loadedAccount = await identityWallet.loadAccount(
          USER_1.keystore,
          DEFAULT_PASSWORD,
          IDENTITY_ADDRESS,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(loadedAccount, ACCOUNT_KEYS)
        assert.equal(loadedAccount.address, IDENTITY_ADDRESS)
        assert.equal(loadedAccount.pubKey, USER_1.pubKey)
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover account from mnemonic', async () => {
        const recoveredAccount = await identityWallet.recoverFromSeed(
          USER_1.mnemonic,
          USER_1.password,
          IDENTITY_ADDRESS
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, IDENTITY_ADDRESS)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })

      it('should recover account from mnemonic with progress callback', async () => {
        const recoveredAccount = await identityWallet.recoverFromSeed(
          USER_1.mnemonic,
          USER_1.password,
          IDENTITY_ADDRESS,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, IDENTITY_ADDRESS)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })
    })

    describe('#recoverFromPrivateKey()', () => {
      beforeEach(() => init())

      it('should recover account from private key', async () => {
        const recoveredAccount = await identityWallet.recoverFromPrivateKey(
          USER_1.privateKey,
          DEFAULT_PASSWORD,
          IDENTITY_ADDRESS
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, IDENTITY_ADDRESS)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })

      it('should recover account from private key with progress callback', async () => {
        const recoveredAccount = await identityWallet.recoverFromSeed(
          USER_1.mnemonic,
          DEFAULT_PASSWORD,
          IDENTITY_ADDRESS,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, IDENTITY_ADDRESS)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })
    })
  })
})
