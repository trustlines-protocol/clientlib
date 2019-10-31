import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'
import { EthersWallet } from '../../src/wallets/EthersWallet'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import {
  DEFAULT_PASSWORD,
  TL_WALLET_DATA_KEYS,
  TL_WALLET_DATA_META_KEYS,
  USER_1,
  USER_1_ETHERS_WALLET_V1
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('EthersWallet', () => {
    // Test object
    let ethersWallet: EthersWallet

    // Mock classes
    let fakeTLProvider: TLProvider

    const init = () => {
      fakeTLProvider = new FakeTLProvider()
      ethersWallet = new EthersWallet(fakeTLProvider)
    }

    describe('#create()', () => {
      beforeEach(() => init())

      it('should create wallet data of type ethers', async () => {
        const createdWalletData = await ethersWallet.create()
        assert.hasAllKeys(createdWalletData, TL_WALLET_DATA_KEYS)
        assert.hasAllKeys(createdWalletData.meta, TL_WALLET_DATA_META_KEYS)
        assert.isString(createdWalletData.address)
      })
    })

    describe('#loadFrom()', () => {
      beforeEach(() => init())

      it('should load newly created wallet data', async () => {
        const createdWalletData = await ethersWallet.create()
        await ethersWallet.loadFrom(createdWalletData)
        assert.equal(createdWalletData.address, ethersWallet.address)
      })

      it('should throw error for unsupported version', async () => {
        await assert.isRejected(
          ethersWallet.loadFrom({
            ...USER_1_ETHERS_WALLET_V1,
            version: 10
          })
        )
      })
    })

    describe('#getWalletData()', () => {
      beforeEach(() => init())

      it('should return wallet data', async () => {
        const createdWalletData = await ethersWallet.create()
        await ethersWallet.loadFrom(createdWalletData)
        const walletData = await ethersWallet.getWalletData()
        assert.deepEqual(walletData, createdWalletData)
      })

      it('should throw error for not loaded wallet', async () => {
        await assert.isRejected(ethersWallet.getWalletData())
      })
    })

    describe('#encryptToSerializedKeystore()', () => {
      beforeEach(() => init())

      it('should encrypt wallet data of type ethers', async () => {
        const walletData = await ethersWallet.create()
        const serializedEncryptedWallet = await ethersWallet.encryptToSerializedKeystore(
          walletData,
          DEFAULT_PASSWORD
        )
        assert.isString(serializedEncryptedWallet)
      })

      it('should encrypt wallet data of type ethers with progress callback', async () => {
        const walletData = await ethersWallet.create()
        const serializedEncryptedWallet = await ethersWallet.encryptToSerializedKeystore(
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
        const createdWalletData = await ethersWallet.create()
        const serializedEncryptedWallet = await ethersWallet.encryptToSerializedKeystore(
          createdWalletData,
          DEFAULT_PASSWORD
        )
        const recoveredWalletData = await ethersWallet.recoverFromEncryptedKeystore(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD
        )
        assert.deepEqual(recoveredWalletData, createdWalletData)
      })

      it('should recover wallet data from serialized encrypted keystore with progress callback', async () => {
        const createdWalletData = await ethersWallet.create()
        const serializedEncryptedWallet = await ethersWallet.encryptToSerializedKeystore(
          createdWalletData,
          DEFAULT_PASSWORD
        )
        const recoveredWalletData = await ethersWallet.recoverFromEncryptedKeystore(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD,
          progress => {
            assert.isNumber(progress)
          }
        )
        assert.deepEqual(recoveredWalletData, createdWalletData)
      })

      it('should recover wallet data from serialized encrypted keystore ', async () => {
        const recoveredWalletData = await ethersWallet.recoverFromEncryptedKeystore(
          USER_1.keystore,
          USER_1.password
        )
        assert.deepEqual(recoveredWalletData, USER_1_ETHERS_WALLET_V1)
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover wallet data from mnemonic', async () => {
        const recoveredWalletData = await ethersWallet.recoverFromSeed(
          USER_1.mnemonic
        )
        assert.deepEqual(recoveredWalletData, USER_1_ETHERS_WALLET_V1)
      })
    })

    describe('#recoverFromPrivateKey()', () => {
      beforeEach(() => init())

      it('should recover wallet data from private key', async () => {
        const recoveredWalletData = await ethersWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        assert.equal(recoveredWalletData.address, USER_1.address)
        assert.equal(
          recoveredWalletData.meta.signingKey.privateKey,
          USER_1.privateKey
        )
        assert.isUndefined(recoveredWalletData.meta.signingKey.mnemonic)
      })
    })

    describe('#signMsgHash()', () => {
      const MSG_HASH = ethers.utils.id('hello world')
      const MSG_DIGEST = ethers.utils.hashMessage(
        ethers.utils.arrayify(MSG_HASH)
      )

      beforeEach(() => init())

      it('should sign the given message hash', async () => {
        const walletData = await ethersWallet.create()
        await ethersWallet.loadFrom(walletData)
        const { concatSig } = await ethersWallet.signMsgHash(MSG_HASH)
        assert.equal(
          ethers.utils.recoverAddress(MSG_DIGEST, concatSig),
          walletData.address
        )
      })
    })

    describe('#signMessage()', () => {
      beforeEach(() => init())

      it('should sign the given message', async () => {
        const walletData = await ethersWallet.create()
        await ethersWallet.loadFrom(walletData)
        const { concatSig } = await ethersWallet.signMessage('hello world')
        assert.equal(
          ethers.utils.verifyMessage('hello world', concatSig),
          walletData.address
        )
      })
    })

    describe('#showSeed()', () => {
      beforeEach(() => init())

      it('should return mnemonic for newly created walletData', async () => {
        const walletData = await ethersWallet.create()
        await ethersWallet.loadFrom(walletData)
        const mnemonic = await ethersWallet.showSeed()
        const mnemonicArr = mnemonic.split(' ')
        assert.isString(mnemonic)
        assert.lengthOf(mnemonicArr, 12)
      })

      it('should return undefined for walletData recovered from private key', async () => {
        const recoveredWalletData = await ethersWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        await ethersWallet.loadFrom(recoveredWalletData)
        const mnemonic = await ethersWallet.showSeed()
        assert.isUndefined(mnemonic)
      })

      it('should return mnemonic for walletData recovered from encrypted wallet', async () => {
        const recoveredWalletData = await ethersWallet.recoverFromEncryptedKeystore(
          USER_1.keystore,
          USER_1.password
        )
        await ethersWallet.loadFrom(recoveredWalletData)
        const mnemonic = await ethersWallet.showSeed()
        assert.equal(mnemonic, USER_1.mnemonic)
      })

      it('should return mnemonic for walletData recovered from mnemonic', async () => {
        const recoveredWalletData = await ethersWallet.recoverFromSeed(
          USER_1.mnemonic
        )
        await ethersWallet.loadFrom(recoveredWalletData)
        const mnemonic = await ethersWallet.showSeed()
        assert.equal(mnemonic, USER_1.mnemonic)
      })

      it('should throw error if no walletData is loaded', async () => {
        await assert.isRejected(ethersWallet.showSeed())
      })
    })

    describe('#exportPrivateKey()', () => {
      beforeEach(() => init())

      it('should return private key', async () => {
        const recoveredWalletData = await ethersWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        await ethersWallet.loadFrom(recoveredWalletData)
        const privateKey = await ethersWallet.exportPrivateKey()
        assert.equal(privateKey, USER_1.privateKey)
      })

      it('should throw error if no walletData is loaded', async () => {
        await assert.isRejected(ethersWallet.exportPrivateKey())
      })
    })
  })
})
