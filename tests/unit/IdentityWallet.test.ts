import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import {
  ACCOUNT_KEYS,
  DEFAULT_PASSWORD,
  ENC_IDENTITY_WALLET_META_KEYS,
  FAKE_META_TX,
  FAKE_META_TX_PRIVATE_KEY,
  FAKE_META_TX_SIGNATURE,
  IDENTITY_ADDRESS,
  IDENTITY_FACTORY_ADDRESS,
  IDENTITY_IMPLEMENTATION_ADDRESS,
  IDENTITY_OWNER_ADDRESS,
  IDENTITY_WALLET_META_KEYS,
  TL_WALLET_KEYS,
  USER_1,
  USER_1_IDENTITY_WALLET_V1
} from '../Fixtures'

import { MetaTransaction } from '../../src/typings'
import {
  calculateIdentityAddress,
  IdentityWallet
} from '../../src/wallets/IdentityWallet'

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
      identityWallet = new IdentityWallet(fakeTLProvider, {
        identityFactoryAddress: IDENTITY_FACTORY_ADDRESS,
        identityImplementationAddress: IDENTITY_IMPLEMENTATION_ADDRESS
      })
    }

    // Constants
    const testUser = USER_1_IDENTITY_WALLET_V1

    describe('#createAccount()', () => {
      beforeEach(() => init())

      it('should create account', async () => {
        const createdAccount = await identityWallet.createAccount()
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(createdAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(createdAccount.wallet.meta, IDENTITY_WALLET_META_KEYS)
      })
    })

    describe('#loadAccount()', () => {
      beforeEach(() => init())

      it('should load account from given identityWallet', async () => {
        const createdAccount = await identityWallet.createAccount()
        await identityWallet.loadAccount(createdAccount.wallet)
        assert.equal(createdAccount.address, identityWallet.address)
      })
    })

    describe('#encryptWallet()', () => {
      beforeEach(() => init())

      it('should encrypt wallet of type WALLET_TYPE_IDENTITY', async () => {
        const { wallet } = await identityWallet.createAccount()
        const serializedEncryptedWallet = await identityWallet.encryptWallet(
          wallet,
          DEFAULT_PASSWORD
        )
        const deserializedEncryptedWallet = JSON.parse(
          serializedEncryptedWallet
        )
        assert.isString(serializedEncryptedWallet)
        assert.hasAllKeys(deserializedEncryptedWallet, TL_WALLET_KEYS)
        assert.hasAllKeys(
          deserializedEncryptedWallet.meta,
          ENC_IDENTITY_WALLET_META_KEYS
        )
      })

      it('should encrypt wallet of type WALLET_TYPE_IDENTITY with progress callback', async () => {
        const { wallet } = await identityWallet.createAccount()
        const serializedEncryptedWallet = await identityWallet.encryptWallet(
          wallet,
          DEFAULT_PASSWORD,
          progress => {
            assert.isNumber(progress)
          }
        )
        assert.isString(serializedEncryptedWallet)
      })
    })

    describe('#recoverFromEncryptedWallet()', () => {
      beforeEach(() => init())

      it('should recover account from serialized encrypted TLWallet v2', async () => {
        const createdAccount = await identityWallet.createAccount()
        const serializedEncryptedWallet = await identityWallet.encryptWallet(
          createdAccount.wallet,
          DEFAULT_PASSWORD
        )
        const recoveredAccount = await identityWallet.recoverFromEncryptedWallet(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD
        )
        assert.deepEqual(recoveredAccount, createdAccount)
      })

      it('should recover account from serialized encrypted TLWallet v2 with progress callback', async () => {
        const createdAccount = await identityWallet.createAccount()
        const serializedEncryptedWallet = await identityWallet.encryptWallet(
          createdAccount.wallet,
          DEFAULT_PASSWORD
        )
        const recoveredAccount = await identityWallet.recoverFromEncryptedWallet(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD,
          progress => {
            assert.isNumber(progress)
          }
        )
        assert.deepEqual(recoveredAccount, createdAccount)
      })

      it('should throw error for serialized encrypted keystore ', async () => {
        assert.isRejected(
          identityWallet.recoverFromEncryptedWallet(
            USER_1.keystore,
            DEFAULT_PASSWORD
          )
        )
      })

      it('should recover account from serialized encrypted TLWallet v1', async () => {
        const recoveredAccount = await identityWallet.recoverFromEncryptedWallet(
          USER_1_IDENTITY_WALLET_V1.serializedWallet,
          DEFAULT_PASSWORD
        )
        assert.equal(
          recoveredAccount.address,
          USER_1_IDENTITY_WALLET_V1.address
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(
          recoveredAccount.wallet.meta,
          IDENTITY_WALLET_META_KEYS
        )
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover account from mnemonic', async () => {
        const recoveredAccount = await identityWallet.recoverFromSeed(
          testUser.mnemonic
        )
        assert.equal(recoveredAccount.address, testUser.address)
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(
          recoveredAccount.wallet.meta,
          IDENTITY_WALLET_META_KEYS
        )
      })
    })

    describe('#recoverFromPrivateKey()', () => {
      beforeEach(() => init())

      it('should recover account from private key', async () => {
        const recoveredAccount = await identityWallet.recoverFromPrivateKey(
          testUser.privateKey
        )
        assert.equal(recoveredAccount.address, testUser.address)
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(
          recoveredAccount.wallet.meta,
          IDENTITY_WALLET_META_KEYS
        )
      })
    })

    describe('#deployIdentity', () => {
      beforeEach(() => init())

      it('should deploy an identity', async () => {
        const recoveredAccount = await identityWallet.recoverFromSeed(
          testUser.mnemonic
        )
        await identityWallet.loadAccount(recoveredAccount.wallet)
        const address = await identityWallet.deployIdentity()
        assert.equal(address, identityWallet.address)
      })
    })

    describe('#signMetaTransaction', () => {
      beforeEach(() => init())

      it('should sign meta-transaction', async () => {
        const recoveredAccount = await identityWallet.recoverFromPrivateKey(
          FAKE_META_TX_PRIVATE_KEY
        )
        await identityWallet.loadAccount(recoveredAccount.wallet)

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

    describe('#calculateIdentityAddress', () => {
      it('should calculate the right identity contract address', () => {
        assert.equal(
          calculateIdentityAddress(
            IDENTITY_FACTORY_ADDRESS,
            IDENTITY_OWNER_ADDRESS
          ),
          IDENTITY_ADDRESS
        )
      })
    })
  })
})
