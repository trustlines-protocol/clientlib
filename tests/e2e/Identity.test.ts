import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { IdentityWallet } from '../../src/wallets/IdentityWallet'

import { RelayProvider } from '../../src/providers/RelayProvider'

import { config } from '../Fixtures'

import utils from '../../src/utils'

chai.use(chaiAsPromised)
const { assert } = chai

describe('e2e', () => {
  const { expect } = chai

  const { host, path, port, protocol } = config
  const wsProtocol = 'ws'

  const relayApiUrl = utils.buildApiUrl(protocol, host, port, path)
  const relayWpUrl = utils.buildApiUrl(wsProtocol, host, port, path)
  const relayProvider = new RelayProvider(relayApiUrl, relayWpUrl)

  const DEFAULT_PASSWORD = 'ts'
  const ACCOUNT_KEYS = ['address', 'keystore', 'pubKey']

  describe('Deploy identity by creating an identity account', async () => {
    const identityWallet = new IdentityWallet(relayProvider)
    const createdAccount = await identityWallet.createAccount(DEFAULT_PASSWORD)
    assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
    expect(createdAccount.address).to.not.equal(undefined)
  })
})
