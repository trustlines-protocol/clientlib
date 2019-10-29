import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ethers } from 'ethers'
import 'mocha'

import {
  verifyWalletData,
  WALLET_TYPE_ETHERS
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
  })
})
