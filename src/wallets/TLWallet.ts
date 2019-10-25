import { TLSigner } from '../signers/TLSigner'
import { TLWalletSchema, UserObject } from '../typings'

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
