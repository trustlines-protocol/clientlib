import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import 'mocha'

import { BigNumber } from 'bignumber.js'

import { IdentityWallet } from '../../src/wallets/IdentityWallet'

import {
  AMOUNT_KEYS,
  createAndLoadUsers,
  deployIdentities,
  identityFactoryAddress,
  identityImplementationAddress,
  secondIdentityImplementationAddress,
  TL_WALLET_DATA_KEYS,
  tlNetworkConfigIdentity,
  wait
} from '../Fixtures'

import {
  FeePayer,
  NonceMechanism,
  RawTxObject,
  TransactionStatus
} from '../../src/typings'

import { TLNetwork } from '../../src/TLNetwork'

import { formatEther, parseUnits } from 'ethers/lib/utils'
import { TLProvider } from '../../src/providers/TLProvider'

chai.use(chaiAsPromised)
const { assert } = chai

describe('e2e', () => {
  describe('Identity', () => {
    const { expect } = chai

    let relayProvider: TLProvider
    let identityWallet: IdentityWallet
    let trustlinesNetwork: TLNetwork
    let trustlinesNetwork2: TLNetwork

    before(async () => {
      trustlinesNetwork = new TLNetwork(tlNetworkConfigIdentity)
      trustlinesNetwork2 = new TLNetwork(tlNetworkConfigIdentity)
      relayProvider = trustlinesNetwork.relayProvider

      identityWallet = trustlinesNetwork.wallet as IdentityWallet
    })

    describe('Deploy identity', () => {
      it('should deploy an identity contract after creating an identity account', async () => {
        const createdWalletData = await identityWallet.create()
        await identityWallet.loadFrom(createdWalletData)
        const address = await identityWallet.deployIdentity()
        assert.hasAllKeys(createdWalletData, TL_WALLET_DATA_KEYS)
        expect(createdWalletData.address.length).to.equal(42)
        expect(createdWalletData.address.slice(0, 2)).to.equal('0x')
        expect(address).to.equal(createdWalletData.address)
      })

      it('should deploy two identities in parallel', async () => {
        await createAndLoadUsers([trustlinesNetwork, trustlinesNetwork2])
        await Promise.all([
          trustlinesNetwork.user.deployIdentity(),
          trustlinesNetwork2.user.deployIdentity()
        ])
      })
    })

    describe('Update identity', () => {
      let newIdentityWallet

      before(async () => {
        // make sure we have a wallet with a proper implementation and deployed identity
        const walletData = await identityWallet.create()
        await identityWallet.loadFrom(walletData)
        await identityWallet.deployIdentity()

        // create a new identity with a different implementation address
        newIdentityWallet = new IdentityWallet(
          relayProvider,
          tlNetworkConfigIdentity.chainId,
          tlNetworkConfigIdentity.identityFactoryAddress,
          secondIdentityImplementationAddress,
          NonceMechanism.Random
        )
        await newIdentityWallet.loadFrom(walletData)

        expect(
          await newIdentityWallet.getIdentityImplementationAddress()
        ).to.equal(identityImplementationAddress)
        expect(
          await newIdentityWallet.isIdentityImplementationUpToDate()
        ).to.equal(false)
      })

      it('should prepare an update of identity implementation', async () => {
        const preparedUpdate = await newIdentityWallet.prepareImplementationUpdate(
          trustlinesNetwork.transaction
        )
        expect(preparedUpdate.rawTx).to.have.all.keys([
          'from',
          'to',
          'value',
          'data',
          'nonce',
          'baseFee',
          'gasLimit',
          'gasPrice',
          'totalFee',
          'feeRecipient',
          'currencyNetworkOfFees'
        ])
      })

      it('should confirm an update of identity implementation', async () => {
        const preparedUpdate = await newIdentityWallet.prepareImplementationUpdate(
          trustlinesNetwork.transaction
        )
        const txHash = await identityWallet.confirm(preparedUpdate.rawTx)
        const txStatus = await relayProvider.getTxStatus(txHash)

        expect(txStatus.status).to.equal(TransactionStatus.Success)
        expect(
          await newIdentityWallet.getIdentityImplementationAddress()
        ).to.equal(secondIdentityImplementationAddress)
        expect(
          await newIdentityWallet.isIdentityImplementationUpToDate()
        ).to.equal(true)
      })
    })

    describe('Identity infos', () => {
      before(async () => {
        const walletData = await identityWallet.create()
        await identityWallet.loadFrom(walletData)
        await identityWallet.deployIdentity()
      })

      it('should give a different nonce after transaction was sent', async () => {
        const firstNonce = await relayProvider.getIdentityNonce(
          identityWallet.address
        )

        const { rawTx } = await trustlinesNetwork.payment.prepareEth(
          identityWallet.address,
          0
        )
        rawTx.nonce = firstNonce
        await trustlinesNetwork.payment.confirm(rawTx)

        const secondNonce = await relayProvider.getIdentityNonce(
          identityWallet.address
        )

        expect(firstNonce).to.equal(1)
        expect(secondNonce).to.equal(2)
      })

      it('should get balance of identity contract', async () => {
        const balance = await identityWallet.getBalance()
        assert.hasAllKeys(balance, AMOUNT_KEYS)
        expect(balance.value).to.equal('0')
      })

      it('should get identity implementation address', async () => {
        const implementationAddress = await identityWallet.getIdentityImplementationAddress()
        expect(implementationAddress).to.equal(
          tlNetworkConfigIdentity.identityImplementationAddress
        )
      })

      it('should increase balance of identity contract', async () => {
        const preBalance = await identityWallet.getBalance()

        await relayProvider.postToEndpoint(`request-ether`, {
          address: identityWallet.address
        })

        const postBalance = await identityWallet.getBalance()

        expect(
          formatEther(
            parseUnits(postBalance.raw, 'wei').sub(
              parseUnits(preBalance.raw, 'wei')
            )
          )
        ).to.equal('0.01')
      })
    })

    describe('Interaction with identity', () => {
      beforeEach(async () => {
        const walletData = await identityWallet.create()
        await identityWallet.loadFrom(walletData)
        await identityWallet.deployIdentity()
      })

      it('should relay meta transaction and return a transaction hash', async () => {
        let rawTx: RawTxObject = {
          data: '0x',
          from: identityWallet.address,
          nonce: 1,
          to: identityWallet.address,
          value: 0
        }

        rawTx = (await identityWallet.prepareTransaction(rawTx)).rawTx

        const transactionHash = await identityWallet.confirm(rawTx)
        assert.isString(transactionHash)
        expect(transactionHash.length).to.equal(66)
        expect(transactionHash.slice(0, 2)).to.equal('0x')
      })

      it('should transfer eth via a meta-transaction', async () => {
        const secondWallet = new IdentityWallet(
          relayProvider,
          tlNetworkConfigIdentity.chainId,
          identityFactoryAddress,
          identityImplementationAddress,
          NonceMechanism.Random
        )
        const walletData = await secondWallet.create()
        await secondWallet.loadFrom(walletData)

        await relayProvider.postToEndpoint(`request-ether`, {
          address: identityWallet.address
        })

        const preBalance = await identityWallet.getBalance()

        const transaction = await trustlinesNetwork.transaction.prepareValueTransaction(
          identityWallet.address,
          secondWallet.address,
          new BigNumber(1000000000000000)
        )

        await identityWallet.confirm(transaction.rawTx)
        await wait()

        const postBalance = await identityWallet.getBalance()
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
        const walletData = await identityWallet.create()
        await identityWallet.loadFrom(walletData)
        await identityWallet.deployIdentity()
      })

      it('should prepare a transaction and get delegation fees', async () => {
        const rawTx: RawTxObject = {
          data: '0x',
          from: identityWallet.address,
          nonce: 1,
          to: identityWallet.address,
          value: 0
        }

        const metaTransactionFees = await identityWallet.getMetaTxFees(rawTx)
        expect(metaTransactionFees).to.have.all.keys(
          'baseFee',
          'gasPrice',
          'currencyNetworkOfFees',
          'feeRecipient'
        )
        expect(metaTransactionFees.baseFee).to.be.a('string')
        expect(metaTransactionFees.gasPrice).to.be.a('string')
      })
    })

    describe('Error messages', () => {
      before(async () => {
        const walletData = await identityWallet.create()
        await identityWallet.loadFrom(walletData)
        await identityWallet.deployIdentity()
      })

      it('should get a detailed error message for invalid nonce', async () => {
        const rawTx: RawTxObject = {
          data: '0x',
          from: identityWallet.address,
          nonce: 123456,
          to: identityWallet.address,
          value: 0
        }
        try {
          await identityWallet.getMetaTxFees(rawTx)
        } catch (error) {
          expect(error.message).to.contain(
            'Invalid (nonce, hash) pair for meta-tx'
          )
        }
      })
    })
  })
})
