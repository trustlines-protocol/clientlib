import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import {
  DEFAULT_PASSWORD,
  FAKE_CHAIN_ID,
  FAKE_META_TX_PRIVATE_KEY,
  FAKE_PRIVATE_KEY,
  FAKE_SAFE_META_TX,
  FAKE_SAFE_META_TX_SIGNATURE,
  GNOSIS_SAFE_L2_ADDRESS,
  GNOSIS_SAFE_PROXY_FACTORY_ADDRESS,
  IDENTITY_FACTORY_ADDRESS,
  IDENTITY_IMPLEMENTATION_ADDRESS,
  TL_WALLET_DATA_KEYS,
  TL_WALLET_DATA_META_KEYS,
  USER_1,
  USER_1_ADDRESS,
  USER_1_SAFE_WALLET_V1
} from '../Fixtures'

import { SafeRelayProvider } from '../../src/providers/SafeRelayProvider'
import { NonceMechanism, SafeMetaTransaction } from '../../src/typings'
import { calculateSafeAddress, SafeWallet } from '../../src/wallets/SafeWallet'
import { FakeSafeRelayProvider } from '../helpers/FakeSafeRelayProvider'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('SafeWallet', () => {
    // Test object
    let safeWallet: SafeWallet

    // Mock classes
    let fakeTLProvider: TLProvider
    let fakeSafeWalletProvider: SafeRelayProvider

    const init = () => {
      fakeTLProvider = new FakeTLProvider()
      fakeSafeWalletProvider = new FakeSafeRelayProvider()
      safeWallet = new SafeWallet(
        fakeTLProvider,
        fakeSafeWalletProvider,
        FAKE_CHAIN_ID,
        IDENTITY_FACTORY_ADDRESS,
        IDENTITY_IMPLEMENTATION_ADDRESS,
        GNOSIS_SAFE_L2_ADDRESS,
        GNOSIS_SAFE_PROXY_FACTORY_ADDRESS,
        NonceMechanism.Random
      )
    }

    describe('#create()', () => {
      beforeEach(() => init())

      it('should create random wallet data', async () => {
        const walletData = await safeWallet.create()
        assert.hasAllKeys(walletData, TL_WALLET_DATA_KEYS)
        assert.hasAllKeys(walletData.meta, TL_WALLET_DATA_META_KEYS)
        assert.isString(walletData.address)
      })

      it('should throw an error if wallet was not created and we try to call getAddress', async () => {
        try {
          await safeWallet.getAddress()
        } catch (e) {
          assert.equal(e.message, 'No wallet loaded.')
        }
      })
      it('should throw an error if wallet was not created and we try to call getBalance', async () => {
        try {
          await safeWallet.getBalance()
        } catch (e) {
          assert.equal(e.message, 'No wallet loaded.')
        }
      })
      it('should throw an error if wallet was not created and we try to call showSeed', async () => {
        try {
          await safeWallet.showSeed()
        } catch (e) {
          assert.equal(e.message, 'No wallet loaded.')
        }
      })
      it('should throw an error if wallet was not created and we try to call exportPrivateKey', async () => {
        try {
          await safeWallet.exportPrivateKey()
        } catch (e) {
          assert.equal(e.message, 'No wallet loaded.')
        }
      })
    })

    describe('#loadFrom()', () => {
      beforeEach(() => init())

      it('should load wallet data', async () => {
        const walletData = await safeWallet.create()
        await safeWallet.loadFrom(walletData)
        assert.equal(walletData.address, safeWallet.address)
      })
    })

    describe('#getWalletData()', () => {
      beforeEach(() => init())

      it('should return wallet data', async () => {
        const createdWalletData = await safeWallet.create()
        await safeWallet.loadFrom(createdWalletData)
        const walletData = await safeWallet.getWalletData()
        assert.deepEqual(walletData, createdWalletData)
      })

      it('should throw error for not loaded wallet', async () => {
        await assert.isRejected(safeWallet.getWalletData())
      })
    })

    describe('#encryptToSerializedKeystore()', () => {
      beforeEach(() => init())

      it('should encrypt wallet data of type identity', async () => {
        const walletData = await safeWallet.create()
        const serializedEncryptedWallet = await safeWallet.encryptToSerializedKeystore(
          walletData,
          DEFAULT_PASSWORD
        )
        assert.isString(serializedEncryptedWallet)
      })

      it('should encrypt wallet data of type identity with progress callback', async () => {
        const walletData = await safeWallet.create()
        const serializedEncryptedWallet = await safeWallet.encryptToSerializedKeystore(
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
        const walletData = await safeWallet.create()
        const serializedEncryptedWallet = await safeWallet.encryptToSerializedKeystore(
          walletData,
          DEFAULT_PASSWORD
        )
        const recoveredWalletData = await safeWallet.recoverFromEncryptedKeystore(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD
        )
        assert.deepEqual(recoveredWalletData, walletData)
      })

      it('should recover wallet data from serialized encrypted wallet with progress callback', async () => {
        const walletData = await safeWallet.create()
        const serializedEncryptedWallet = await safeWallet.encryptToSerializedKeystore(
          walletData,
          DEFAULT_PASSWORD
        )
        const recoveredWalletData = await safeWallet.recoverFromEncryptedKeystore(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD,
          progress => {
            assert.isNumber(progress)
          }
        )
        assert.deepEqual(recoveredWalletData, walletData)
      })

      it('should recover wallet data from serialized encrypted keystore', async () => {
        const recoveredWalletData = await safeWallet.recoverFromEncryptedKeystore(
          USER_1.keystore,
          USER_1.password
        )
        assert.equal(recoveredWalletData.address, USER_1.safeAddress)
        assert.deepEqual(recoveredWalletData, USER_1_SAFE_WALLET_V1)
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover wallet data from mnemonic', async () => {
        const recoveredWalletData = await safeWallet.recoverFromSeed(
          USER_1.mnemonic
        )
        assert.equal(recoveredWalletData.address, USER_1.safeAddress)
        assert.deepEqual(recoveredWalletData, USER_1_SAFE_WALLET_V1)
      })
    })

    describe('#recoverFromPrivateKey()', () => {
      beforeEach(() => init())

      it('should recover wallet data from private key', async () => {
        const recoveredWalletData = await safeWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        assert.equal(recoveredWalletData.address, USER_1.safeAddress)
        assert.isUndefined(recoveredWalletData.meta.signingKey.mnemonic)
      })
    })

    describe('#deployIdentity', () => {
      beforeEach(() => init())

      it('should deploy an identity', async () => {
        const recoveredWalletData = await safeWallet.recoverFromSeed(
          USER_1.mnemonic
        )
        await safeWallet.loadFrom(recoveredWalletData)
        const address = await safeWallet.deployIdentity()
        assert.equal(address, safeWallet.address)
      })

      it('identity not deployed', async () => {
        const recoveredWalletData = await safeWallet.recoverFromPrivateKey(
          '0x' + FAKE_PRIVATE_KEY
        )

        await safeWallet.loadFrom(recoveredWalletData)

        const deployed = await safeWallet.isIdentityDeployed()

        assert.equal(deployed, false)
      })
    })

    describe('#signMetaTransaction', () => {
      beforeEach(() => init())

      it('should sign meta-transaction', async () => {
        const walletData = await safeWallet.recoverFromPrivateKey(
          FAKE_META_TX_PRIVATE_KEY
        )
        await safeWallet.loadFrom(walletData)

        const metaTransaction: SafeMetaTransaction = FAKE_SAFE_META_TX

        await safeWallet.signMetaTransaction(metaTransaction)

        // check all but the last two elements, corresponding to the version number
        assert.deepEqual(
          metaTransaction.signatures[0],
          FAKE_SAFE_META_TX_SIGNATURE
        )
      })
    })

    describe('#calculateIdentityAddress', () => {
      it('should calculate the right identity contract address', () => {
        assert.equal(
          calculateSafeAddress(
            USER_1_ADDRESS,
            GNOSIS_SAFE_L2_ADDRESS,
            GNOSIS_SAFE_PROXY_FACTORY_ADDRESS
          ),
          USER_1.safeAddress
        )
      })
    })

    describe('#getNonce', () => {
      beforeEach(() => init())

      it('should get a nonce from safe relay', async () => {
        const walletData = await safeWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        await safeWallet.loadFrom(walletData)

        const nonce = await safeWallet.getNonce()

        assert.equal(nonce, '0')
      })
    })
  })
})
