import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import { WalletFromEthers } from '../../src/wallets/WalletFromEthers'
import {
  USER_1,
  USER_1_ETHERS_WALLET_V1,
  USER_1_IDENTITY_WALLET_V1
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('WalletFromEthers', () => {
    describe('#fromWalletData()', () => {
      it('should construct from ethers wallet data', () => {
        const walletFromEthers = WalletFromEthers.fromWalletData(
          USER_1_ETHERS_WALLET_V1
        )
        assert.instanceOf(walletFromEthers, ethers.Wallet)
      })

      it('should construct from identity wallet data', () => {
        const walletFromEthers = WalletFromEthers.fromWalletData(
          USER_1_IDENTITY_WALLET_V1
        )
        assert.instanceOf(walletFromEthers, ethers.Wallet)
      })
    })

    describe('#createRandom()', () => {
      it('should create random wallet', () => {
        const walletFromEthers = WalletFromEthers.createRandom()
        assert.instanceOf(walletFromEthers, ethers.Wallet)
      })
    })

    describe('#fromEncryptedJson()', () => {
      it('should construct from encrypted json', async () => {
        const walletFromEthers = await WalletFromEthers.fromEncryptedJson(
          USER_1.keystore,
          USER_1.password
        )
        assert.instanceOf(walletFromEthers, ethers.Wallet)
      })

      it('should construct from encrypted json with callback', async () => {
        const walletFromEthers = await WalletFromEthers.fromEncryptedJson(
          USER_1.keystore,
          USER_1.password,
          progress => assert.isNumber(progress)
        )
        assert.instanceOf(walletFromEthers, ethers.Wallet)
      })
    })

    describe('#fromMnemonic()', () => {
      it('should construct from mnemonic', () => {
        const walletFromEthers = WalletFromEthers.fromMnemonic(USER_1.mnemonic)
        assert.instanceOf(walletFromEthers, ethers.Wallet)
      })
    })

    describe('#toEthersWalletData()', () => {
      it('should convert to ethers wallet data', () => {
        const walletFromEthers = WalletFromEthers.fromWalletData(
          USER_1_ETHERS_WALLET_V1
        )
        const ethersWalletData = walletFromEthers.toEthersWalletData()
        assert.deepEqual(ethersWalletData, USER_1_ETHERS_WALLET_V1)
      })
    })

    describe('#toIdentityWalletData()', () => {
      it('should convert to identity wallet data', () => {
        const walletFromEthers = WalletFromEthers.fromWalletData(
          USER_1_IDENTITY_WALLET_V1
        )
        const identityWalletData = walletFromEthers.toIdentityWalletData(
          USER_1_IDENTITY_WALLET_V1.address
        )
        assert.deepEqual(identityWalletData, USER_1_IDENTITY_WALLET_V1)
      })
    })
  })
})
