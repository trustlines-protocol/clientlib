import {
  TxInfos,
  RawTxObject,
  UserObject,
  Signature,
  Amount
} from '../typings'

/**
 * Interface for different signer strategies.
 */
export interface TxSigner {
  address: string
  pubKey: string
  createAccount (): Promise<UserObject>
  loadAccount (serializedKeystore: string): Promise<UserObject>
  signMsgHash (msgHash: string): Promise<Signature>
  getBalance (): Promise<Amount>
  encrypt (msg: string, theirPubKey: string): Promise<any>
  decrypt (encMsg: any, theirPubKey: string): Promise<any>
  showSeed (): Promise<string>
  recoverFromSeed (seed: string): Promise<UserObject>
  exportPrivateKey (): Promise<string>
  getTxInfos (userAddress: string): Promise<TxInfos>
  confirm (rawTx: RawTxObject): Promise<string>
}
