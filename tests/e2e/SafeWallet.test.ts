import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { BigNumber } from 'bignumber.js'

import { SafeWallet } from '../../src/wallets/SafeWallet'

import {
  AMOUNT_KEYS,
  createAndLoadUsers,
  deployIdentities,
  identityFactoryAddress,
  identityImplementationAddress,
  TL_WALLET_DATA_KEYS,
  tlNetworkConfigSafe,
  wait
} from '../Fixtures'

import { FeePayer, NonceMechanism, RawTxObject } from '../../src/typings'

import { TLNetwork } from '../../src/TLNetwork'

import { formatEther, parseUnits } from 'ethers/lib/utils'
import { SafeRelayProvider } from '../../src/providers/SafeRelayProvider'
import { TLProvider } from '../../src/providers/TLProvider'

chai.use(chaiAsPromised)
const { assert } = chai

describe('e2e', () => {
  describe('SafeWallet', () => {
    const { expect } = chai

    let relayProvider: TLProvider
    let safeRelayProvider: SafeRelayProvider
    let safeWallet: SafeWallet
    let trustlinesNetwork: TLNetwork
    let trustlinesNetwork2: TLNetwork

    before(async () => {
      trustlinesNetwork = new TLNetwork(tlNetworkConfigSafe)
      trustlinesNetwork2 = new TLNetwork(tlNetworkConfigSafe)
      relayProvider = trustlinesNetwork.relayProvider
      safeRelayProvider = trustlinesNetwork.safeRelayProvider
      safeWallet = trustlinesNetwork.wallet as SafeWallet
    })

    describe('Deploy SafeWallet', () => {
      it('should deploy a gnosis safe contract after creating an identity account', async () => {
        const createdWalletData = await safeWallet.create()
        await safeWallet.loadFrom(createdWalletData)
        const address = await safeWallet.deployIdentity()
        assert.hasAllKeys(createdWalletData, TL_WALLET_DATA_KEYS)
        expect(createdWalletData.address.length).to.equal(42)
        expect(createdWalletData.address.slice(0, 2)).to.equal('0x')
        expect(address).to.equal(createdWalletData.address)
      })

      it('should deploy two safes in parallel', async () => {
        await createAndLoadUsers([trustlinesNetwork, trustlinesNetwork2])
        await Promise.all([
          trustlinesNetwork.user.deployIdentity(),
          trustlinesNetwork2.user.deployIdentity()
        ])
      })
    })

    describe('Safes infos', () => {
      before(async () => {
        const walletData = await safeWallet.create()

        await safeWallet.loadFrom(walletData)
        await safeWallet.deployIdentity()
      })

      it('should give a different nonce after transaction was sent', async () => {
        const firstNonce = await safeWallet.getNonce()

        const { rawTx } = await trustlinesNetwork.payment.prepareEth(
          safeWallet.address,
          0
        )

        rawTx.nonce = firstNonce
        await trustlinesNetwork.payment.confirm(rawTx)

        const secondNonce = await safeWallet.getNonce()

        expect(firstNonce).to.equal('0')
        expect(secondNonce).to.equal('1')
      })

      it('should get balance of safe contract', async () => {
        const balance = await safeWallet.getBalance()
        assert.hasAllKeys(balance, AMOUNT_KEYS)
        expect(balance.value).to.equal('0')
      })

      it('should get safe implementation address', async () => {
        const implementationAddress = await safeWallet.getIdentityImplementationAddress()
        expect(implementationAddress).to.equal(
          tlNetworkConfigSafe.gnosisSafeL2Address
        )
      })

      it('should increase balance of safe contract', async () => {
        const preBalance = await safeWallet.getBalance()

        await relayProvider.postToEndpoint(`request-ether`, {
          address: safeWallet.address
        })

        const postBalance = await safeWallet.getBalance()

        expect(
          formatEther(
            parseUnits(postBalance.raw, 'wei').sub(
              parseUnits(preBalance.raw, 'wei')
            )
          )
        ).to.equal('0.01')
      })
    })

    describe('Interaction with safe', () => {
      beforeEach(async () => {
        const walletData = await safeWallet.create()
        await safeWallet.loadFrom(walletData)
        await safeWallet.deployIdentity()
      })

      it('should relay meta transaction and return a transaction hash', async () => {
        let rawTx: RawTxObject = {
          data: '0x',
          from: safeWallet.address,
          nonce: 1,
          to: safeWallet.address,
          value: 0
        }

        rawTx = (await safeWallet.prepareTransaction(rawTx)).rawTx

        const transactionHash = await safeWallet.confirm(rawTx)
        assert.isString(transactionHash)
        expect(transactionHash.length).to.equal(66)
        expect(transactionHash.slice(0, 2)).to.equal('0x')
      })

      it('should transfer eth via a meta-transaction', async () => {
        const secondWallet = new SafeWallet(
          relayProvider,
          safeRelayProvider,
          tlNetworkConfigSafe.chainId,
          identityFactoryAddress,
          identityImplementationAddress,
          tlNetworkConfigSafe.gnosisSafeL2Address,
          tlNetworkConfigSafe.gnosisSafeProxyFactoryAddress,
          NonceMechanism.Random
        )
        const walletData = await secondWallet.create()
        await secondWallet.loadFrom(walletData)
        await secondWallet.deployIdentity()

        await relayProvider.postToEndpoint(`request-ether`, {
          address: safeWallet.address
        })

        const preBalance = await safeWallet.getBalance()

        const transaction = await trustlinesNetwork.transaction.prepareValueTransaction(
          safeWallet.address,
          secondWallet.address,
          new BigNumber(1000000000000000)
        )

        await safeWallet.confirm(transaction.rawTx)

        const postBalance = await safeWallet.getBalance()
        const postSecondBalance = await secondWallet.getBalance()

        expect(preBalance.value).to.equal('0.01')
        expect(postBalance.value).to.not.equal('0.01')
        expect(postSecondBalance.value).to.equal('0.001')
      })

      it('should get a path in a currency network', async () => {
        const [user1, user2] = await createAndLoadUsers([
          trustlinesNetwork,
          trustlinesNetwork2
        ])
        await deployIdentities([trustlinesNetwork, trustlinesNetwork2])
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

    describe('Delegation fees', () => {
      before(async () => {
        const walletData = await safeWallet.create()
        await safeWallet.loadFrom(walletData)
        await safeWallet.deployIdentity()
      })

      it('should prepare a transaction and get delegation fees', async () => {
        const rawTx: RawTxObject = {
          data: '0x',
          from: safeWallet.address,
          nonce: 1,
          to: safeWallet.address,
          value: 0
        }

        const metaTransactionFees = await safeWallet.getMetaTxFees(rawTx)

        expect(metaTransactionFees).to.have.all.keys(
          'baseGas',
          'gasToken',
          'gasPrice',
          'refundReceiver',
          'safeTxGas'
        )
        expect(metaTransactionFees.safeTxGas).to.be.a('string')
        expect(metaTransactionFees.baseGas).to.be.a('string')
        expect(metaTransactionFees.gasPrice).to.be.a('string')
        expect(metaTransactionFees.gasToken).to.be.a('string')
        expect(metaTransactionFees.refundReceiver).to.be.a('string')
      })
    })
  })
})
