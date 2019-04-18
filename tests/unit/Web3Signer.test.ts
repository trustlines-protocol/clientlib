import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { Web3Signer } from '../../src/signers/Web3Signer'

import { FakeWeb3Provider } from '../helpers/FakeWeb3Provider'

import {
  FAKE_RAW_TX_OBJECT,
  FAKE_TX_HASH,
  FAKE_TX_INFOS,
  USER_1
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('Web3Signer', () => {
    const { expect } = chai
    // test object
    let web3Signer: Web3Signer

    // mocked web3 provider
    let fakeWeb3Provider: FakeWeb3Provider

    const init = () => {
      fakeWeb3Provider = new FakeWeb3Provider()
      web3Signer = new Web3Signer(fakeWeb3Provider)
    }

    describe('#getAddress()', () => {
      beforeEach(() => init())

      it('should return address', async () => {
        const address = await web3Signer.getAddress()
        assert.isString(address)
      })
    })

    describe('#getBalance()', () => {
      beforeEach(() => init())

      it('should return balance', async () => {
        const balance = await web3Signer.getBalance()
        assert.hasAllKeys(balance, ['decimals', 'value', 'raw'])
        assert.isNumber(balance.decimals)
        assert.isString(balance.value)
        assert.isString(balance.raw)
      })
    })

    describe('#confirm()', () => {
      beforeEach(() => init())

      it('should return transaction hash', async () => {
        const transactionHash = await web3Signer.confirm(FAKE_RAW_TX_OBJECT)
        assert.isString(transactionHash)
      })
    })

    describe('#signMessage()', () => {
      beforeEach(() => init())

      it('should return signed message', async () => {
        const signature = await web3Signer.signMessage('hello world')
        assert.hasAllKeys(signature, ['concatSig', 'ecSignature'])
        assert.hasAllKeys(signature.ecSignature, ['r', 's', 'v'])
      })
    })

    describe('#signMsgHash()', () => {
      beforeEach(() => init())

      it('should return signed message hash', async () => {
        const signature = await web3Signer.signMsgHash(FAKE_TX_HASH)
        assert.hasAllKeys(signature, ['concatSig', 'ecSignature'])
        assert.hasAllKeys(signature.ecSignature, ['r', 's', 'v'])
      })
    })

    describe('#getTxInfos()', () => {
      beforeEach(() => init())

      it('should return txinfos', async () => {
        const txInfos = await web3Signer.getTxInfos(USER_1.address)
        expect(txInfos).to.deep.equal(FAKE_TX_INFOS)
      })
    })
  })
})
