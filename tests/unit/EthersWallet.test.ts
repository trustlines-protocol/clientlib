import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'
import { EthersWallet } from '../../src/wallets/EthersWallet'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import {
  ACCOUNT_KEYS,
  DEFAULT_PASSWORD,
  ENC_ETHERS_WALLET_META_KEYS,
  ETHERS_WALLET_META_KEYS,
  TL_WALLET_KEYS,
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

    describe('#createAccount()', () => {
      beforeEach(() => init())

      it('should create account with wallet of type WALLET_TYPE_ETHERS', async () => {
        const createdAccount = await ethersWallet.createAccount()
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(createdAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(createdAccount.wallet.meta, ETHERS_WALLET_META_KEYS)
      })
    })

    describe('#loadAccount()', () => {
      beforeEach(() => init())

      it('should load account from given ethersWallet', async () => {
        const createdAccount = await ethersWallet.createAccount()
        await ethersWallet.loadAccount(createdAccount.wallet)
        assert.equal(createdAccount.address, ethersWallet.address)
      })
    })

    describe('#encryptWallet()', () => {
      beforeEach(() => init())

      it('should encrypt wallet of type WALLET_TYPE_ETHERS', async () => {
        const { wallet } = await ethersWallet.createAccount()
        const serializedEncryptedWallet = await ethersWallet.encryptWallet(
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
          ENC_ETHERS_WALLET_META_KEYS
        )
      })

      it('should encrypt wallet of type WALLET_TYPE_ETHERS with progress callback', async () => {
        const { wallet } = await ethersWallet.createAccount()
        const serializedEncryptedWallet = await ethersWallet.encryptWallet(
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
        const createdAccount = await ethersWallet.createAccount()
        const serializedEncryptedWallet = await ethersWallet.encryptWallet(
          createdAccount.wallet,
          DEFAULT_PASSWORD
        )
        const recoveredAccount = await ethersWallet.recoverFromEncryptedWallet(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD
        )
        assert.deepEqual(recoveredAccount, createdAccount)
      })

      it('should recover account from serialized encrypted TLWallet v2 with progress callback', async () => {
        const createdAccount = await ethersWallet.createAccount()
        const serializedEncryptedWallet = await ethersWallet.encryptWallet(
          createdAccount.wallet,
          DEFAULT_PASSWORD
        )
        const recoveredAccount = await ethersWallet.recoverFromEncryptedWallet(
          serializedEncryptedWallet,
          DEFAULT_PASSWORD,
          progress => {
            assert.isNumber(progress)
          }
        )
        assert.deepEqual(recoveredAccount, createdAccount)
      })

      it('should recover account from serialized encrypted keystore ', async () => {
        const recoveredAccount = await ethersWallet.recoverFromEncryptedWallet(
          USER_1.keystore,
          DEFAULT_PASSWORD
        )
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet.meta, ETHERS_WALLET_META_KEYS)
      })

      it('should recover account from serialized encrypted TLWallet v1', async () => {
        const recoveredAccount = await ethersWallet.recoverFromEncryptedWallet(
          USER_1_ETHERS_WALLET_V1.serializedWallet,
          DEFAULT_PASSWORD
        )
        assert.equal(recoveredAccount.address, USER_1_ETHERS_WALLET_V1.address)
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet.meta, ETHERS_WALLET_META_KEYS)
      })
    })

    describe('#recoverFromSeed()', () => {
      beforeEach(() => init())

      it('should recover account from mnemonic', async () => {
        const recoveredAccount = await ethersWallet.recoverFromSeed(
          USER_1.mnemonic
        )
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet.meta, ETHERS_WALLET_META_KEYS)
      })
    })

    describe('#recoverFromPrivateKey()', () => {
      beforeEach(() => init())

      it('should recover account from private key', async () => {
        const recoveredAccount = await ethersWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet, TL_WALLET_KEYS)
        assert.hasAllKeys(recoveredAccount.wallet.meta, ETHERS_WALLET_META_KEYS)
      })
    })

    describe('#signMsgHash()', () => {
      const MSG_HASH = ethers.utils.id('hello world')
      const MSG_DIGEST = ethers.utils.hashMessage(
        ethers.utils.arrayify(MSG_HASH)
      )

      beforeEach(() => init())

      it('should sign the given message hash', async () => {
        const user = await ethersWallet.createAccount()
        await ethersWallet.loadAccount(user.wallet)
        const { concatSig } = await ethersWallet.signMsgHash(MSG_HASH)
        assert.equal(
          ethers.utils.recoverAddress(MSG_DIGEST, concatSig),
          user.address
        )
      })
    })

    describe('#signMessage()', () => {
      beforeEach(() => init())

      it('should sign the given message', async () => {
        const user = await ethersWallet.createAccount()
        await ethersWallet.loadAccount(user.wallet)
        const { concatSig } = await ethersWallet.signMessage('hello world')
        assert.equal(
          ethers.utils.verifyMessage('hello world', concatSig),
          user.address
        )
      })
    })

    describe('#showSeed()', () => {
      beforeEach(() => init())

      it('should return mnemonic for newly created account', async () => {
        const account = await ethersWallet.createAccount()
        await ethersWallet.loadAccount(account.wallet)
        const mnemonic = await ethersWallet.showSeed()
        const mnemonicArr = mnemonic.split(' ')
        assert.isString(mnemonic)
        assert.lengthOf(mnemonicArr, 12)
      })

      it('should return undefined for account recovered from private key', async () => {
        const recoveredAccount = await ethersWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        await ethersWallet.loadAccount(recoveredAccount.wallet)
        const mnemonic = await ethersWallet.showSeed()
        assert.isUndefined(mnemonic)
      })

      it('should return mnemonic for account recovered from encrypted wallet', async () => {
        const recoveredAccount = await ethersWallet.recoverFromEncryptedWallet(
          USER_1.keystore,
          DEFAULT_PASSWORD
        )
        await ethersWallet.loadAccount(recoveredAccount.wallet)
        const mnemonic = await ethersWallet.showSeed()
        assert.equal(mnemonic, USER_1.mnemonic)
      })

      it('should return mnemonic for account recovered from mnemonic', async () => {
        const recoveredAccount = await ethersWallet.recoverFromSeed(
          USER_1.mnemonic
        )
        await ethersWallet.loadAccount(recoveredAccount.wallet)
        const mnemonic = await ethersWallet.showSeed()
        assert.equal(mnemonic, USER_1.mnemonic)
      })

      it('should throw error if no account is loaded', async () => {
        assert.isRejected(ethersWallet.showSeed())
      })
    })

    describe('#exportPrivateKey()', () => {
      beforeEach(() => init())

      it('should return private key', async () => {
        const recoveredAccount = await ethersWallet.recoverFromPrivateKey(
          USER_1.privateKey
        )
        await ethersWallet.loadAccount(recoveredAccount.wallet)
        const privateKey = await ethersWallet.exportPrivateKey()
        assert.equal(privateKey, USER_1.privateKey)
      })

      it('should throw error if no account is loaded', async () => {
        assert.isRejected(ethersWallet.exportPrivateKey())
      })
    })
  })
})
