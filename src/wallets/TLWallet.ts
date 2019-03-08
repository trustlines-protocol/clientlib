import { UserObject } from '../typings'

/**
 * Interface for different wallet strategies.
 */
export interface TLWallet {
  address: string
  pubKey: string
  showSeed(): Promise<string>
  exportPrivateKey(): Promise<string>
  createAccount(password: string, progressCallback?: any): Promise<UserObject>
  loadAccount(
    serializedKeystore: string,
    password: string,
    identityAddress?: string,
    progressCallback?: any
  ): Promise<UserObject>
  recoverFromSeed(
    seed: string,
    password: string,
    identityAddress?: string,
    progressCallback?: any
  ): Promise<UserObject>
  encrypt(msg: string, theirPubKey: string): Promise<any>
  decrypt(encMsg: any, theirPubKey: string): Promise<any>
}
