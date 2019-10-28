import { ethers } from 'ethers'

import { TLSigner } from '../signers/TLSigner'
import {
  EthersWalletData,
  IdentityWalletData,
  TLWalletData,
  WalletType
} from '../typings'

/**
 * Interface for different wallet strategies.
 */
export interface TLWallet extends TLSigner {
  address: string
  getAddress(): Promise<string>
  showSeed(): Promise<string>
  exportPrivateKey(): Promise<string>
  create(): Promise<TLWalletData>
  deployIdentity(): Promise<string>
  isIdentityDeployed(): Promise<boolean>
  loadFrom(tlWalletData: TLWalletData): Promise<void>
  getWalletData(): Promise<TLWalletData>
  recoverFromSeed(seed: string): Promise<TLWalletData>
  recoverFromEncryptedKeystore(
    serializedEncryptedKeystore: string,
    password: string,
    progressCallback?: (progress: number) => any
  ): Promise<TLWalletData>
  recoverFromPrivateKey(privateKey: string): Promise<TLWalletData>
  encryptToSerializedKeystore(
    tlWalletData: TLWalletData,
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
const DEFAULT_DERIVATION_PATH = `m/44'/60'/0'/0/0`

/**
 * Checks if type and version of given wallet data are supported.
 * @param walletData Wallet data to check.
 * @param walletType Expected wallet type.
 * @param expectedVersions Expected wallet versions.
 */
export function verifyWalletData(
  walletData: TLWalletData,
  walletType: string,
  expectedVersions: number[]
): void {
  if (walletData.type !== walletType) {
    throw new Error(
      `The wallet data given is of the wrong type: ${
        walletData.type
      }, expected: ${walletType}`
    )
  }
  if (expectedVersions.indexOf(walletData.version) === -1) {
    throw new Error(
      `The wallet data version given is not handled: version ${
        walletData.version
      }, expected one of: ${expectedVersions}`
    )
  }
}

/**
 * Converts an instance of `ethers.Wallet` to `TLWalletData` specified by `walletType`.
 * @param walletFromEthers Instance of `ethers.Wallet`.
 * @param walletType Wallet data type to convert to.
 * @param address Address to store in wallet data.
 */
export function walletFromEthersToWalletData(
  walletFromEthers: ethers.Wallet,
  walletType: WalletType,
  address: string
): EthersWalletData | IdentityWalletData {
  return {
    address,
    version: TL_WALLET_VERSION,
    type: walletType,
    meta: {
      signingKey: {
        mnemonic: walletFromEthers.mnemonic,
        privateKey: walletFromEthers.privateKey
      }
    }
  }
}

/**
 * Takes wallet data of type `ethers` or `identity` and returns an instance of `ethers.Wallet`.
 * @param walletData Wallet data of type `ethers` or `identity`.
 */
export function walletDataToWalletFromEthers(
  walletData: EthersWalletData | IdentityWalletData
): ethers.Wallet {
  const { signingKey } = walletData.meta
  const signingKeyFromEthers = new ethers.utils.SigningKey(
    signingKey.privateKey
  )
  // @ts-ignore
  signingKeyFromEthers.mnemonic = signingKey.mnemonic
  // @ts-ignore
  signingKeyFromEthers.path = DEFAULT_DERIVATION_PATH
  const walletFromEthers = new ethers.Wallet(signingKeyFromEthers)
  return walletFromEthers
}
