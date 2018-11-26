import * as chai from 'chai'
import * as lightwallet from 'eth-lightwallet'
import 'mocha'

import { Configuration } from '../../src/Configuration'
import { Utils } from '../../src/Utils'

import { LightwalletSigner } from '../../src/signers/LightwalletSigner'
import { config, keystore1, user1 } from '../Fixtures'

const { assert } = chai

describe('integration', () => {
  describe('LightwalletSigner', () => {
    let lightwalletSigner: LightwalletSigner

    before(async () => {
      const configuration = new Configuration(config)
      const utils = new Utils(configuration)
      lightwalletSigner = new LightwalletSigner(lightwallet, utils)
    })

    describe('#createAccount()', () => {
      it('should create new account using eth-lightwallet', async () => {
        const newUser = await lightwalletSigner.createAccount()
        assert.hasAllKeys(newUser, ['address', 'keystore', 'pubKey'])
        assert.isString(newUser.address)
        assert.isString(newUser.keystore)
        assert.isString(newUser.address)
      })
    })

    describe('#loadAccount()', () => {
      it('should load serialized eth-lightwallet keystore', async () => {
        const existingUser = await lightwalletSigner.loadAccount(keystore1)
        assert.hasAllKeys(existingUser, ['address', 'keystore', 'pubKey'])
        assert.equal(existingUser.address, user1.address)
        assert.isString(existingUser.keystore, keystore1)
        assert.equal(existingUser.pubKey, user1.pubKey)
      })
    })

    describe('#signMsgHash()', () => {
      before(async () => {
        await lightwalletSigner.loadAccount(keystore1)
      })

      it('should sign message hash and return ec signature', async () => {
        // sha3 hash of `Hello world!`
        const msgHash =
          '9c24b06143c07224c897bac972e6e92b46cf18063f1a469ebe2f7a0966306105'
        const signature = await lightwalletSigner.signMsgHash(msgHash)
        assert.hasAllKeys(signature, ['ecSignature', 'concatSig'])
        assert.hasAllKeys(signature.ecSignature, ['r', 's', 'v'])
        assert.isString(signature.ecSignature.r)
        assert.isString(signature.ecSignature.s)
        assert.isNumber(signature.ecSignature.v)
      })
    })

    describe('#encrypt()', () => {
      before(async () => {
        await lightwalletSigner.loadAccount(keystore1)
      })

      it('should return encryption object', async () => {
        const encObj = await lightwalletSigner.encrypt(
          'hello world!',
          user1.pubKey
        )
        assert.hasAllKeys(encObj, [
          'version',
          'asymAlg',
          'symAlg',
          'symNonce',
          'symEncMessage',
          'encryptedSymKey'
        ])
      })
    })

    describe('#decrypt()', () => {
      let encObj

      before(async () => {
        await lightwalletSigner.loadAccount(keystore1)
        encObj = await lightwalletSigner.encrypt('hello world!', user1.pubKey)
      })

      it('should decrypt cipher text', async () => {
        const decryptedMsg = await lightwalletSigner.decrypt(
          encObj,
          user1.pubKey
        )
        assert.equal(decryptedMsg, 'hello world!')
      })
    })

    describe('#showSeed()', () => {
      const seed =
        'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'

      before(async () => {
        await lightwalletSigner.loadAccount(keystore1)
      })

      it('should return 12 word seed phrase of loaded user', async () => {
        const returnedSeed = await lightwalletSigner.showSeed()
        assert.equal(returnedSeed, seed)
      })
    })

    describe('#recoverFromSeed()', () => {
      const seed =
        'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'

      it('should recover user from seed', async () => {
        const recoveredUser = await lightwalletSigner.recoverFromSeed(seed)
        assert.hasAllKeys(recoveredUser, ['address', 'pubKey', 'keystore'])
        assert.equal(recoveredUser.address, user1.address)
        assert.equal(recoveredUser.pubKey, user1.pubKey)
        assert.isString(recoveredUser.keystore)
      })
    })
  })
})
