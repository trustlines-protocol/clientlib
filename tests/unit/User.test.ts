import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { User } from '../../src/User'

import { FakeTLProvider } from '../helpers/FakeTLProvider'
import { FakeTLSigner } from '../helpers/FakeTLSigner'
import { FakeTLWallet } from '../helpers/FakeTLWallet'

import {
  FAKE_ENC_OBJECT,
  FAKE_SEED,
  TL_WALLET_DATA,
  TL_WALLET_DATA_KEYS
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

    const init = () => {
      fakeTLProvider = new FakeTLProvider()
      fakeTLWallet = new FakeTLWallet()
      fakeTLSigner = new FakeTLSigner()
      user = new User({
        provider: fakeTLProvider,
        signer: fakeTLSigner,
        wallet: fakeTLWallet
      })
    }

    describe('#constructor()', () => {
      beforeEach(() => init())

      it('should construct a User instance', () => {
        user = new User({
          provider: fakeTLProvider,
          signer: fakeTLSigner,
          wallet: fakeTLWallet
        })
        assert.isString(user.address)
      })
    })

    describe('#create()', () => {
      beforeEach(() => init())

      it('should create a new user', async () => {
        const walletData = await user.create()
        assert.isString(walletData.address)
        assert.hasAllKeys(walletData, TL_WALLET_DATA_KEYS)
      })

      it('should throw error', async () => {
        fakeTLWallet.setError('createWalletData')
        await assert.isRejected(user.create())
      })
    })

    describe('#loadFrom()', () => {
      beforeEach(() => init())

      it('should load from existing wallet data', async () => {
        await user.loadFrom(TL_WALLET_DATA)
        const loadedWalletData = await user.getWalletData()
        assert.deepEqual(loadedWalletData, TL_WALLET_DATA)
      })

      it('should throw error', async () => {
        fakeTLWallet.setError('loadFrom')
        await assert.isRejected(user.loadFrom(TL_WALLET_DATA))
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
        const recoveredWalletData = await user.recoverFromSeed(FAKE_SEED)
        assert.hasAllKeys(recoveredWalletData, TL_WALLET_DATA_KEYS)
      })

      it('should throw error', async () => {
        fakeTLWallet.setError('recoverWalletDataFromSeed')
        await assert.isRejected(user.recoverFromSeed(FAKE_SEED))
      })
    })

    describe('#createLink()', () => {
      beforeEach(() => init())

      const username = 'testname'

      it('should create trustlines:// link', async () => {
        const contactLink = user.createLink(username)
        assert.equal(
          contactLink,
          `trustlines://contact/${user.address}/${username}`
        )
      })

      it('should create trustlines:// link with queryParams', async () => {
        const contactLink = user.createLink(username, '', {
          param1: 'param1',
          param2: 'param2'
        })
        assert.equal(
          contactLink,
          `trustlines://contact/${
            user.address
          }/${username}?param1=param1&param2=param2`
        )
      })

      it('should create custom link', async () => {
        const contactLink = user.createLink(username, 'http://custom.network')
        assert.equal(
          contactLink,
          `http://custom.network/contact/${user.address}/${username}`
        )
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
