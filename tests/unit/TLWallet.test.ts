import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import {
  verifyWalletData,
  WALLET_TYPE_ETHERS,
  walletDataToWalletFromEthers,
  walletFromEthersToWalletData
} from '../../src/wallets/TLWallet'
import {
  TL_WALLET_DATA_KEYS,
  TL_WALLET_DATA_META_KEYS,
  USER_1_ETHERS_WALLET_V1,
  USER_1_IDENTITY_WALLET_V1
} from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('TLWallet', () => {
    describe('#verifyWalletDataTypeAndVersion()', () => {
      it('should throw for unsupported type', () => {
        assert.throws(() =>
          verifyWalletData(USER_1_ETHERS_WALLET_V1, 'otherType', [1])
        )
      })

      it('should throw for unsupported version number', () => {
        assert.throws(() =>
          verifyWalletData(USER_1_ETHERS_WALLET_V1, 'ethers', [10])
        )
      })
    })

    describe('#walletFromEthersToWalletData()', () => {
      it('should transform ethers.Wallet to EthersWalletData', () => {
        const walletFromEthers = ethers.Wallet.createRandom()
        const walletData = walletFromEthersToWalletData(
          walletFromEthers,
          WALLET_TYPE_ETHERS,
          walletFromEthers.address
        )
        assert.hasAllKeys(walletData, TL_WALLET_DATA_KEYS)
        assert.hasAllKeys(walletData.meta, TL_WALLET_DATA_META_KEYS)
      })
    })

    describe('#walletDataToWalletFromEthers()', () => {
      it('should transform EthersWallet to instance of ethers.Wallet', () => {
        const walletFromEthers = walletDataToWalletFromEthers(
          USER_1_ETHERS_WALLET_V1
        )
        const { signingKey } = USER_1_ETHERS_WALLET_V1.meta
        assert.equal(walletFromEthers.privateKey, signingKey.privateKey)
        assert.equal(walletFromEthers.mnemonic, signingKey.mnemonic)
      })

      it('should transform IdentityWallet to instance of ethers.Wallet', () => {
        const walletFromEthers = walletDataToWalletFromEthers(
          USER_1_IDENTITY_WALLET_V1
        )
        const { signingKey } = USER_1_ETHERS_WALLET_V1.meta
        assert.equal(walletFromEthers.privateKey, signingKey.privateKey)
        assert.equal(walletFromEthers.mnemonic, signingKey.mnemonic)
      })
    })
  })
})
