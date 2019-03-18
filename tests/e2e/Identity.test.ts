import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { IdentityWallet } from '../../src/wallets/IdentityWallet'

import { RelayProvider } from '../../src/providers/RelayProvider'

import { config, USER_1 } from '../Fixtures'

import utils from '../../src/utils'

chai.use(chaiAsPromised)
const { assert } = chai

describe('e2e', () => {
  describe('Identity', () => {
    const { expect } = chai

    let relayProvider
    let DEFAULT_PASSWORD
    let ACCOUNT_KEYS

    before(async () => {
      const { host, path, port, protocol } = config
      const wsProtocol = 'ws'

      const relayApiUrl = utils.buildApiUrl(protocol, host, port, path)
      const relayWpUrl = utils.buildApiUrl(wsProtocol, host, port, path)
      relayProvider = new RelayProvider(relayApiUrl, relayWpUrl)

      DEFAULT_PASSWORD = 'ts'
      ACCOUNT_KEYS = ['address', 'serializedWallet', 'pubKey']
    })

    it('should deploy an identity contract when creating an identity account', async () => {
      const identityWallet = new IdentityWallet(relayProvider)
      const createdAccount = await identityWallet.createAccount(
        DEFAULT_PASSWORD
      )
      assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
      expect(createdAccount.address.length).to.equal(42)
      expect(createdAccount.address.slice(0, 2)).to.equal('0x')
    })
  })
})
