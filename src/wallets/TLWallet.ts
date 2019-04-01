import { TLSigner } from '../signers/TLSigner'
import { UserObject } from '../typings'

/**
 * Interface for different wallet strategies.
 */
export interface TLWallet extends TLSigner {
  address: string
  pubKey: string
  showSeed(): Promise<string>
  exportPrivateKey(): Promise<string>
  createAccount(password: string, progressCallback?: any): Promise<UserObject>
  loadAccount(
    serializedWallet: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject>
  recoverFromSeed(
    seed: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject>
  encrypt(msg: string, theirPubKey: string): Promise<any>
  decrypt(encMsg: any, theirPubKey: string): Promise<any>
}

export const TL_WALLET_VERSION = 1.0
export const WALLET_TYPE_ETHERS = 'WalletTypeEthers'
export const WALLET_TYPE_IDENTITY = 'WalletTypeIdentity'
