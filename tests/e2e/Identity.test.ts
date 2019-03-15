import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { IdentityWallet } from '../../src/wallets/IdentityWallet'

import { RelayProvider } from '../../src/providers/RelayProvider'

import { config } from '../Fixtures'

import { RawTxObject } from '../../src/typings'
import utils from '../../src/utils'

chai.use(chaiAsPromised)
const { assert } = chai

describe('e2e', () => {
  describe('Identity', () => {
    const { expect } = chai

    let relayProvider
    let DEFAULT_PASSWORD
    let ACCOUNT_KEYS
    let AMOUNT_KEYS

    let identityWallet: IdentityWallet

    before(async () => {
      const { host, path, port, protocol } = config
      const wsProtocol = 'ws'

      const relayApiUrl = utils.buildApiUrl(protocol, host, port, path)
      const relayWpUrl = utils.buildApiUrl(wsProtocol, host, port, path)
      relayProvider = new RelayProvider(relayApiUrl, relayWpUrl)

      identityWallet = new IdentityWallet(relayProvider)

      DEFAULT_PASSWORD = 'ts'
      ACCOUNT_KEYS = ['address', 'serializedWallet', 'pubKey']
      AMOUNT_KEYS = ['raw', 'value', 'decimals']
    })

    describe('Deploy identity', () => {
      it('should deploy an identity contract when creating an identity account', async () => {
        const createdAccount = await identityWallet.createAccount(
          DEFAULT_PASSWORD
        )
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
        expect(createdAccount.address.length).to.equal(42)
        expect(createdAccount.address.slice(0, 2)).to.equal('0x')
      })
    })

    describe('Interact with identity', () => {
      before(async () => {
        await identityWallet.createAccount(DEFAULT_PASSWORD)
      })

      it('should relay meta transaction and return a transaction hash', async () => {
        const rawTx: RawTxObject = {
          data: '0x',
          from: identityWallet.address,
          nonce: 1,
          to: identityWallet.address,
          value: 0
        }

        const transactionHash = await identityWallet.confirm(rawTx)
        assert.isString(transactionHash)
        expect(transactionHash.length).to.equal(66)
        expect(transactionHash.slice(0, 2)).to.equal('0x')
      })

      it('should get balance of identity contract', async () => {
        const balance = await identityWallet.getBalance()
        assert.hasAllKeys(balance, AMOUNT_KEYS)
        expect(balance.value).to.equal('0')
      })
    })
  })
})
