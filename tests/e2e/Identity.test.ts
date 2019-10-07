import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { BigNumber } from 'bignumber.js'

import { IdentityWallet } from '../../src/wallets/IdentityWallet'

import { RelayProvider } from '../../src/providers/RelayProvider'

import {
  identityFactoryAddress,
  identityImplementationAddress,
  tlNetworkConfig,
  tlNetworkConfigIdentity,
  wait
} from '../Fixtures'

import { FeePayer, RawTxObject, UserObject } from '../../src/typings'
import utils from '../../src/utils'

import { TLNetwork } from '../../src/TLNetwork'

import { TLProvider } from '../../src/providers/TLProvider'

chai.use(chaiAsPromised)
const { assert } = chai

describe('e2e', () => {
  describe('Identity', () => {
    const { expect } = chai

    let relayProvider: TLProvider
    let DEFAULT_PASSWORD
    let ACCOUNT_KEYS
    let AMOUNT_KEYS

    let identityWallet: IdentityWallet

    let trustlinesNetwork: TLNetwork
    let trustlinesNetwork2: TLNetwork

    before(async () => {
      const { host, path, port, protocol } = tlNetworkConfig
      const wsProtocol = 'ws'

      const relayApiUrl = utils.buildApiUrl(protocol, host, port, path)
      const relayWpUrl = utils.buildApiUrl(wsProtocol, host, port, path)
      relayProvider = new RelayProvider(relayApiUrl, relayWpUrl)

      trustlinesNetwork = new TLNetwork(tlNetworkConfigIdentity)
      trustlinesNetwork2 = new TLNetwork(tlNetworkConfigIdentity)

      identityWallet = new IdentityWallet(relayProvider, {
        identityFactoryAddress,
        identityImplementationAddress
      })

      DEFAULT_PASSWORD = 'ts'
      ACCOUNT_KEYS = ['address', 'serializedWallet', 'pubKey']
      AMOUNT_KEYS = ['raw', 'value', 'decimals']
    })

    describe('Deploy identity', () => {
      it('should deploy an identity contract after creating an identity account', async () => {
        const createdAccount = await identityWallet.createAccount(
          DEFAULT_PASSWORD
        )
        const address = await identityWallet.deployIdentity()
        assert.hasAllKeys(createdAccount, ACCOUNT_KEYS)
        expect(createdAccount.address.length).to.equal(42)
        expect(createdAccount.address.slice(0, 2)).to.equal('0x')
        expect(address).to.equal(createdAccount.address)
      })

      it('should deploy two identities in parallel', async () => {
        const [user1, user2] = await Promise.all([
          trustlinesNetwork.user.recoverFromSeed(
            'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'
          ),
          trustlinesNetwork2.user.recoverFromSeed(
            'license street diagram tribe pig join advance ice wing ill oyster crazy'
          )
        ])
        expect(user1.address).to.equal(
          '0x559dB56D41c125a5c266B50C62243888c0A62ff3'
        )
        expect(user2.address).to.equal(
          '0x3104056b618942f2E94b1eec7CE105eFcA451c49'
        )
        // Delegate did not deploy the right identity contract.
        // Deployed 0x559dB56D41c125a5c266B50C62243888c0A62ff3 instead of 0x3104056b618942f2E94b1eec7CE105eFcA451c49
        await Promise.all([
          trustlinesNetwork.user.deployIdentity(),
          trustlinesNetwork2.user.deployIdentity()
        ])
      })
    })

    describe('Identity infos', () => {
      before(async () => {
        await identityWallet.createAccount(DEFAULT_PASSWORD)
        await identityWallet.deployIdentity()
      })

      it('should give a different nonce after transaction was sent', async () => {
        const firstNonce = (await identityWallet.getTxInfos(
          identityWallet.address
        )).nonce

        const rawTx: RawTxObject = {
          data: '0x',
          from: identityWallet.address,
          nonce: 1,
          to: identityWallet.address,
          value: 0
        }

        await identityWallet.confirm(rawTx)

        const secondNonce = (await identityWallet.getTxInfos(
          identityWallet.address
        )).nonce

        expect(firstNonce).to.equal(1)
        expect(secondNonce).to.equal(2)
      })

      it('should get balance of identity contract', async () => {
        const balance = await identityWallet.getBalance()
        assert.hasAllKeys(balance, AMOUNT_KEYS)
        expect(balance.value).to.equal('0')
      })

      it('should increase balance of identity contract', async () => {
        const preBalance = await identityWallet.getBalance()

        await relayProvider.postToEndpoint(`request-ether`, {
          address: identityWallet.address
        })

        const postBalance = await identityWallet.getBalance()

        expect(
          parseInt(postBalance.value, 10) - parseInt(preBalance.value, 10)
        ).to.equal(1)
      })
    })

    describe('Interaction with identity', () => {
      beforeEach(async () => {
        await identityWallet.createAccount(DEFAULT_PASSWORD)
        await identityWallet.deployIdentity()
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

      it('should transfer eth via a meta-transaction', async () => {
        const secondWallet = new IdentityWallet(relayProvider, {
          identityFactoryAddress,
          identityImplementationAddress
        })
        await secondWallet.createAccount(DEFAULT_PASSWORD)

        await relayProvider.postToEndpoint(`request-ether`, {
          address: identityWallet.address
        })

        const preBalance = await identityWallet.getBalance()

        const transaction = await trustlinesNetwork.transaction.prepareValueTransaction(
          identityWallet.address,
          secondWallet.address,
          new BigNumber(1000000000000000000)
        )

        await identityWallet.confirm(transaction.rawTx)

        const postBalance = await identityWallet.getBalance()
        const postSecondBalance = await secondWallet.getBalance()

        expect(preBalance.value).to.equal('1')
        expect(postBalance.value).to.equal('0')
        expect(postSecondBalance.value).to.equal('1')
      })

      it('should get a path in a currency network', async () => {
        const user1: UserObject = await trustlinesNetwork.user.create()
        const user2: UserObject = await trustlinesNetwork2.user.create()
        await [
          trustlinesNetwork2.user.deployIdentity(),
          trustlinesNetwork.user.deployIdentity()
        ]
        const [network] = await trustlinesNetwork.currencyNetwork.getAll()

        // set up trustlines
        const [tx1, tx2] = await Promise.all([
          trustlinesNetwork.trustline.prepareUpdate(
            network.address,
            user2.address,
            0.01,
            0.01
          ),
          trustlinesNetwork2.trustline.prepareUpdate(
            network.address,
            user1.address,
            0.01,
            0.01
          )
        ])

        await Promise.all([
          trustlinesNetwork.trustline.confirm(tx1.rawTx),
          trustlinesNetwork2.trustline.confirm(tx2.rawTx)
        ])
        // wait for tx to be mined
        await wait()

        const options = { feePayer: FeePayer.Sender }
        const pathObj = await trustlinesNetwork.payment.getTransferPathInfo(
          network.address,
          user1.address,
          user2.address,
          0.001,
          options
        )

        expect(pathObj.maxFees).to.have.all.keys('decimals', 'raw', 'value')
        assert.notDeepEqual(pathObj.path, [])
        expect(pathObj.feePayer).to.equal(FeePayer.Sender)
      })
    })
  })
})
