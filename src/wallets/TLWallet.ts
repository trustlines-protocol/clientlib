import { TLSigner } from '../signers/TLSigner'
import { TLWalletSchema, UserObject } from '../typings'

/**
 * Interface for different wallet strategies.
 */
export interface TLWallet extends TLSigner {
  address: string
  pubKey: string
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

export const TL_WALLET_VERSION = 2
export const WALLET_TYPE_ETHERS = 'WalletTypeEthers'
export const WALLET_TYPE_IDENTITY = 'WalletTypeIdentity'
