import { ethers } from 'ethers'

import { TLSigner } from '../signers/TLSigner'
import {
  EthersWalletSchema,
  IdentityWalletSchema,
  SigningKey,
  TLWalletSchema,
  UserObject
} from '../typings'

/**
 * Interface for different wallet strategies.
 */
export interface TLWallet extends TLSigner {
  address: string
  getAddress(): Promise<string>
  showSeed(): Promise<string>
  exportPrivateKey(): Promise<string>
  createAccount(): Promise<UserObject>
  deployIdentity(): Promise<string>
  isIdentityDeployed(): Promise<boolean>
  loadAccount(wallet: TLWalletSchema): Promise<void>
  recoverFromSeed(seed: string): Promise<UserObject>
  recoverFromEncryptedWallet(
    serializedEncryptedWallet: string,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<UserObject>
  recoverFromPrivateKey(privateKey: string): Promise<UserObject>
  encryptWallet(
    wallet: TLWalletSchema,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<string>
  encrypt(msg: string, theirPubKey: string): Promise<any>
  decrypt(encMsg: any, theirPubKey: string): Promise<any>
}

export const TL_WALLET_VERSION = 1
export const WALLET_TYPE_ETHERS = 'ethers'
export const WALLET_TYPE_IDENTITY = 'identity'
export const EXPECTED_VERSIONS = [1]

export function verifyWalletTypeAndVersion(
  tlWallet: TLWalletSchema,
  walletType: string,
  expectedVersions: number[]
): void {
  if (tlWallet.type !== walletType) {
    throw new Error(
      `The wallet given is of the wrong wallet type: ${
        tlWallet.type
      }, expected: ${walletType}`
    )
  }
  if (expectedVersions.indexOf(tlWallet.version) === -1) {
    throw new Error(
      `The wallet version given is not handled: version ${
        tlWallet.version
      }, expected one of: ${expectedVersions}`
    )
  }
}

/**
 * Takes a `ethers.Wallet` instance and returns a object of internal `SigningKey`.
 * @param walletFromEthers `ethers.Wallet` instance.
 */
export function getSigningKeyFromEthers(
  walletFromEthers: ethers.Wallet
): SigningKey {
  return {
    mnemonic: walletFromEthers.mnemonic,
    privateKey: walletFromEthers.privateKey
  }
}

/**
 * Takes a `TLWallet` of type `ethers` or `identity` and returns an instance of `ethers.Wallet`.
 * @param wallet `TLWallet` of type `ethers` or `identity`.
 */
export function getWalletFromEthers(
  wallet: EthersWalletSchema | IdentityWalletSchema
): ethers.Wallet {
  const { signingKey } = wallet.meta
  const walletFromEthers = new ethers.Wallet(signingKey.privateKey)
  // @ts-ignore
  walletFromEthers.mnemonic = signingKey.mnemonic
  // @ts-ignore
  walletFromEthers.path = `m/44'/60'/0'/0/0`
  return walletFromEthers
}
