import BigNumber from 'bignumber.js'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import {
  DEFAULT_PASSWORD,
  FAKE_CHAIN_ID,
  FAKE_META_TX,
  FAKE_META_TX_PRIVATE_KEY,
  FAKE_META_TX_SIGNATURE,
  IDENTITY_ADDRESS,
  IDENTITY_FACTORY_ADDRESS,
  IDENTITY_IMPLEMENTATION_ADDRESS,
  IDENTITY_OWNER_ADDRESS,
  TL_WALLET_DATA_KEYS,
  TL_WALLET_DATA_META_KEYS,
  USER_1,
  USER_1_IDENTITY_WALLET_V1
} from '../Fixtures'

import { MetaTransaction } from '../../src/typings'
import {
  calculateIdentityAddress,
  getRandomNonce,
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
      identityWallet = new IdentityWallet(fakeTLProvider, FAKE_CHAIN_ID, {
        identityFactoryAddress: IDENTITY_FACTORY_ADDRESS,
        identityImplementationAddress: IDENTITY_IMPLEMENTATION_ADDRESS
      })
    }

    describe('#create()', () => {
      beforeEach(() => init())

      it('should create random wallet data', async () => {
        const walletData = await identityWallet.create()
        assert.hasAllKeys(walletData, TL_WALLET_DATA_KEYS)
        assert.hasAllKeys(walletData.meta, TL_WALLET_DATA_META_KEYS)
        assert.isString(walletData.address)
      })
    })

    describe('#loadFrom()', () => {
      beforeEach(() => init())

      it('should load wallet data', async () => {
        const walletData = await identityWallet.create()
        await identityWallet.loadFrom(walletData)
        assert.equal(walletData.address, identityWallet.address)
      })
    })

    describe('#getWalletData()', () => {
      beforeEach(() => init())

      it('should return wallet data', async () => {
        const createdWalletData = await identityWallet.create()
        await identityWallet.loadFrom(createdWalletData)
        const walletData = await identityWallet.getWalletData()
        assert.deepEqual(walletData, createdWalletData)
      })

      it('should throw error for not loaded wallet', async () => {
        await assert.isRejected(identityWallet.getWalletData())
      })
    })

    describe('#encryptToSerializedKeystore()', () => {
      beforeEach(() => init())

      it('should encrypt wallet data of type identity', async () => {
        const walletData = await identityWallet.create()
        const serializedEncryptedWallet = await identityWallet.encryptToSerializedKeystore(
          walletData,
          DEFAULT_PASSWORD
        )
        assert.isString(serializedEncryptedWallet)
      })

      it('should encrypt wallet data of type identity with progress callback', async () => {
        const walletData = await identityWallet.create()
        const serializedEncryptedWallet = await identityWallet.encryptToSerializedKeystore(
          walletData,
          DEFAULT_PASSWORD,
          progress => {
            assert.isNumber(progress)
          }
        )
        assert.isString(serializedEncryptedWallet)
      })
    })

    describe('#recoverFromEncryptedKeystore()', () => {
      beforeEach(() => init())

      it('should recover wallet data from serialized encrypted keystore', async () => {
        const walletData = await identityWallet.create()
        const serializedEncryptedWallet = await identityWallet.encryptToSerializedKeystore(
          walletData,
          DEFAULT_PASSWORD
        )
        const recoveredWalletData = await identityWallet.recoverFromEncryptedKeystore(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD
        )
        assert.deepEqual(recoveredWalletData, walletData)
      })

      it('should recover wallet data from serialized encrypted wallet with progress callback', async () => {
        const walletData = await identityWallet.create()
        const serializedEncryptedWallet = await identityWallet.encryptToSerializedKeystore(
          walletData,
          DEFAULT_PASSWORD
        )
        const recoveredWalletData = await identityWallet.recoverFromEncryptedKeystore(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD,
          progress => {
            assert.isNumber(progress)
          }
        )
        assert.deepEqual(recoveredWalletData, walletData)
      })

      it('should recover wallet data from serialized encrypted keystore', async () => {
        const recoveredWalletData = await identityWallet.recoverFromEncryptedKeystore(
          USER_1.keystore,
          USER_1.password
        )
        assert.equal(recoveredWalletData.address, USER_1.identityAddress)
        assert.deepEqual(recoveredWalletData, USER_1_IDENTITY_WALLET_V1)
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover wallet data from mnemonic', async () => {
        const recoveredWalletData = await identityWallet.recoverFromSeed(
          USER_1.mnemonic
        )
        assert.equal(recoveredWalletData.address, USER_1.identityAddress)
        assert.deepEqual(recoveredWalletData, USER_1_IDENTITY_WALLET_V1)
      })
    })

    describe('#recoverFromPrivateKey()', () => {
      beforeEach(() => init())

      it('should recover wallet data from private key', async () => {
        const recoveredWalletData = await identityWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        assert.equal(recoveredWalletData.address, USER_1.identityAddress)
        assert.isUndefined(recoveredWalletData.meta.signingKey.mnemonic)
      })
    })

    describe('#deployIdentity', () => {
      beforeEach(() => init())

      it('should deploy an identity', async () => {
        const recoveredWalletData = await identityWallet.recoverFromSeed(
          USER_1.mnemonic
        )
        await identityWallet.loadFrom(recoveredWalletData)
        const address = await identityWallet.deployIdentity()
        assert.equal(address, identityWallet.address)
      })
    })

    describe('#signMetaTransaction', () => {
      beforeEach(() => init())

      it('should sign meta-transaction', async () => {
        const walletData = await identityWallet.recoverFromPrivateKey(
          FAKE_META_TX_PRIVATE_KEY
        )
        await identityWallet.loadFrom(walletData)

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

  describe('#getRandomNonce', () => {
    const minNonce = new BigNumber(2).pow(255).plus(1)
    const maxNonce = new BigNumber(2).pow(256)

    it('should generate nonce in expected range', () => {
      // TODO: how to test this properly? Define range as parameter?
      for (let i = 0; i < 1000; i++) {
        const nonce = getRandomNonce()
        assert.isTrue(
          new BigNumber(nonce).isGreaterThanOrEqualTo(minNonce),
          'Random nonce is too small'
        )
        assert.isTrue(
          new BigNumber(nonce).isLessThan(maxNonce),
          'Random nonce is too big'
        )
      }
    })
  })
})
