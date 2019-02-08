import { Amount, RawTxObject, Signature, UserObject } from '../typings'

/**
 * Interface for different signer strategies.
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
    progressCallback?: any
  ): Promise<UserObject>
  recoverFromSeed(
    seed: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject>
  signMsgHash(msgHash: string): Promise<Signature>
  getBalance(): Promise<Amount>
  confirm(rawTx: RawTxObject): Promise<string>
  encrypt(msg: string, theirPubKey: string): Promise<any>
  decrypt(encMsg: any, theirPubKey: string): Promise<any>
}
