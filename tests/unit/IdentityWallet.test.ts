import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import {
  FAKE_IDENTITY,
  FAKE_META_TX,
  FAKE_META_TX_PRIVATE_KEY,
  FAKE_META_TX_SIGNATURE,
  USER_1,
  USER_1_IDENTITY_WALLET_V1
} from '../Fixtures'

import { MetaTransaction } from '../../src/typings'
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
    const ACCOUNT_KEYS = ['address', 'serializedWallet', 'pubKey']
    const DEFAULT_PASSWORD = 'ts'

    const testUser = USER_1_IDENTITY_WALLET_V1

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

      it('should load account from encrypted json serialized wallet', async () => {
        const loadedAccount = await identityWallet.loadAccount(
          testUser.serializedWallet,
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(loadedAccount, ACCOUNT_KEYS)
      })

      it('should load account from encrypted json serialized wallet with progress callback', async () => {
        const loadedAccount = await identityWallet.loadAccount(
          testUser.serializedWallet,
          DEFAULT_PASSWORD,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(loadedAccount, ACCOUNT_KEYS)
        assert.equal(loadedAccount.address, testUser.address)
      })

      it('should load same account as created account', async () => {
        const createdAccount = await identityWallet.createAccount(
          DEFAULT_PASSWORD
        )
        const loadedAccount = await identityWallet.loadAccount(
          createdAccount.serializedWallet,
          DEFAULT_PASSWORD
        )
        assert.equal(
          createdAccount.serializedWallet,
          loadedAccount.serializedWallet
        )
        assert.equal(createdAccount.address, loadedAccount.address)
      })
    })

    describe('#recoverFromPrivateKey()', () => {
      beforeEach(() => init())

      it('should recover account from private key', async () => {
        const recoveredAccount = await identityWallet.recoverFromPrivateKey(
          testUser.privateKey,
          DEFAULT_PASSWORD,
          testUser.address
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, testUser.address)
      })

      it('should recover account from private key with progress callback', async () => {
        const recoveredAccount = await identityWallet.recoverFromPrivateKey(
          USER_1.privateKey,
          DEFAULT_PASSWORD,
          testUser.address,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, testUser.address)
      })
    })

    describe('#signMetaTransaction', () => {
      beforeEach(() => init())

      it('should sign meta-transaction', async () => {
        await identityWallet.recoverFromPrivateKey(
          FAKE_META_TX_PRIVATE_KEY,
          DEFAULT_PASSWORD,
          testUser.address
        )

        const metaTransaction: MetaTransaction = FAKE_META_TX

        await identityWallet.signMetaTransaction(metaTransaction)

        // check all but the last two elements, corresponding to the version number
        assert.equal(
          metaTransaction.signature.slice(0, -2),
          FAKE_META_TX_SIGNATURE.slice(0, -2)
        )

        // check the version number
        const fakeSignatureVersion = FAKE_META_TX_SIGNATURE.slice(-2)
        const signatureVersion = metaTransaction.signature.slice(-2)
        assert.equal(
          parseInt(`0x${signatureVersion}`, 16) % 27,
          parseInt(fakeSignatureVersion, 16) % 27,
          'Signature version number does not match'
        )
      })
    })
  })
})
