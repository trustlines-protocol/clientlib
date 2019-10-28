import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import {
  getSigningKeyFromEthers,
  getWalletFromEthers,
  verifyWalletTypeAndVersion
} from '../../src/wallets/TLWallet'
import { USER_1_ETHERS_WALLET_V1, USER_1_IDENTITY_WALLET_V1 } from '../Fixtures'

chai.use(chaiAsPromised)
const { assert } = chai

describe('unit', () => {
  describe('TLWallet', () => {
    describe('#verifyWalletTypeAndVersion()', () => {
      it('should throw for unsupported type', () => {
        assert.throws(() =>
          verifyWalletTypeAndVersion(USER_1_ETHERS_WALLET_V1, 'otherType', [1])
        )
      })

      it('should throw for unsupported version number', () => {
        assert.throws(() =>
          verifyWalletTypeAndVersion(USER_1_ETHERS_WALLET_V1, 'ethers', [10])
        )
      })
    })

    describe('#getSigningKeyFromEthers()', () => {
      it('should transform ethers.Wallet to object of internal type SigningKey', () => {
        const walletFromEthers = ethers.Wallet.createRandom()
        const signingKey = getSigningKeyFromEthers(walletFromEthers)
        assert.equal(signingKey.privateKey, walletFromEthers.privateKey)
        assert.equal(signingKey.mnemonic, walletFromEthers.mnemonic)
      })
    })

    describe('#getWalletFromEthers()', () => {
      it('should transform EthersWallet to instance of ethers.Wallet', () => {
        const walletFromEthers = getWalletFromEthers(USER_1_ETHERS_WALLET_V1)
        const { signingKey } = USER_1_ETHERS_WALLET_V1.meta
        assert.equal(walletFromEthers.privateKey, signingKey.privateKey)
        assert.equal(walletFromEthers.mnemonic, signingKey.mnemonic)
      })

      it('should transform IdentityWallet to instance of ethers.Wallet', () => {
        const walletFromEthers = getWalletFromEthers(USER_1_IDENTITY_WALLET_V1)
        const { signingKey } = USER_1_ETHERS_WALLET_V1.meta
        assert.equal(walletFromEthers.privateKey, signingKey.privateKey)
        assert.equal(walletFromEthers.mnemonic, signingKey.mnemonic)
      })
    })
  })
})
