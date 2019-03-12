import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import { TLProvider } from '../../src/providers/TLProvider'
import { EthersWallet } from '../../src/wallets/EthersWallet'

import { FakeTLProvider } from '../helpers/FakeTLProvider'

import { USER_1 } from '../Fixtures'

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

    // Constants
    const ACCOUNT_KEYS = ['address', 'keystore', 'pubKey']
    const DEFAULT_PASSWORD = 'ts'

    describe('#createAccount()', () => {
      beforeEach(() => init())

      it('should create account', async () => {
        const createdAccount = await ethersWallet.createAccount(
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
      })

      it('should create account with progress callback', async () => {
        const createdAccount = await ethersWallet.createAccount(
          DEFAULT_PASSWORD,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
      })
    })

    describe('#loadAccount()', () => {
      beforeEach(() => init())

      it('should load account from encrypted json keystore', async () => {
        const loadedAccount = await ethersWallet.loadAccount(
          USER_1.keystore,
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(loadedAccount, ACCOUNT_KEYS)
      })

      it('should load account from encrypted json keystore with progress callback', async () => {
        const loadedAccount = await ethersWallet.loadAccount(
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
        const recoveredAccount = await ethersWallet.recoverFromSeed(
          USER_1.mnemonic,
          USER_1.password
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })

      it('should recover account from mnemonic with progress callback', async () => {
        const recoveredAccount = await ethersWallet.recoverFromSeed(
          USER_1.mnemonic,
          USER_1.password,
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
        const recoveredAccount = await ethersWallet.recoverFromPrivateKey(
          USER_1.privateKey,
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })

      it('should recover account from private key with progress callback', async () => {
        const recoveredAccount = await ethersWallet.recoverFromSeed(
          USER_1.mnemonic,
          DEFAULT_PASSWORD,
          progress => assert.isNumber(progress)
        )
        assert.hasAllKeys(recoveredAccount, ACCOUNT_KEYS)
        assert.equal(recoveredAccount.address, USER_1.address)
        assert.equal(recoveredAccount.pubKey, USER_1.pubKey)
      })
    })

    describe('#signMsgHash()', () => {
      const MSG_HASH = ethers.utils.id('hello world')
      const MSG_DIGEST = ethers.utils.hashMessage(
        ethers.utils.arrayify(MSG_HASH)
      )

      beforeEach(() => init())

      it('should sign the given message hash', async () => {
        const user = await ethersWallet.createAccount(DEFAULT_PASSWORD)
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
        const user = await ethersWallet.createAccount(DEFAULT_PASSWORD)
        const { concatSig } = await ethersWallet.signMessage('hello world')
        assert.equal(
          ethers.utils.verifyMessage('hello world', concatSig),
          user.address
        )
      })
    })
  })
})
