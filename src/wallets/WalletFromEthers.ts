import { ethers } from 'ethers'

import {
  DEFAULT_DERIVATION_PATH,
  TL_WALLET_VERSION,
  WALLET_TYPE_ETHERS,
  WALLET_TYPE_IDENTITY
} from './TLWallet'

import { EthersWalletData, IdentityWalletData } from '../typings'

/**
 * This is a wrapper class for `ethers.Wallet`. It allows us to customize some of the methods provided by
 * `ethers.Wallet`. We also use this to add some conversion methods adapted to our internal types.
 */
export class WalletFromEthers extends ethers.Wallet {
  public static fromWalletData(
    walletData: EthersWalletData | IdentityWalletData
  ) {
    const { signingKey } = walletData.meta
    const { privateKey, mnemonic } = signingKey
    return new this(privateKey, mnemonic)
  }

  public static createRandom() {
    const { privateKey, mnemonic } = super.createRandom()
    return new this(privateKey, mnemonic)
  }

  public static async fromEncryptedJson(
    encryptedJson: string,
    password: string,
    progressCallback?: (progress: number) => any
  ) {
    const { privateKey, mnemonic } = await super.fromEncryptedJson(
      encryptedJson,
      password,
      progressCallback
    )
    return new this(privateKey, mnemonic)
  }

  public static fromMnemonic(mnemonic: string) {
    const { privateKey } = super.fromMnemonic(mnemonic)
    return new this(privateKey, mnemonic)
  }

  constructor(privateKey: string, mnemonic?: string) {
    const signingKeyFromEthers = new ethers.utils.SigningKey(privateKey)
    // @ts-ignore
    signingKeyFromEthers.mnemonic = mnemonic
    // @ts-ignore
    signingKeyFromEthers.path = DEFAULT_DERIVATION_PATH
    super(signingKeyFromEthers)
  }

  public toEthersWalletData(): EthersWalletData {
    return {
      address: this.address,
      version: TL_WALLET_VERSION,
      type: WALLET_TYPE_ETHERS,
      meta: {
        signingKey: {
          mnemonic: this.mnemonic,
          privateKey: this.privateKey
        }
      }
    }
  }

  public toIdentityWalletData(identityAddress: string): IdentityWalletData {
    return {
      address: identityAddress,
      version: TL_WALLET_VERSION,
      type: WALLET_TYPE_IDENTITY,
      meta: {
        signingKey: {
          mnemonic: this.mnemonic,
          privateKey: this.privateKey
        }
      }
    }
  }
}
