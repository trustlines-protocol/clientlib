import { ethers } from 'ethers'

import { TLProvider } from '../providers/TLProvider'

import { Signature, UserObject } from '../typings'

/**
 * Interface for different signer strategies which extends the given
 * abstract class of `ethers.js`.
 */
export interface TLSigner extends ethers.Signer {
  address: string
  pubKey: string
  mnemonic: string
  privateKey: string
  provider: TLProvider
  createAccount(password: string, progressCallback?): Promise<UserObject>
  loadAccount(
    encryptedKeystore: any,
    password: string,
    progressCallback?
  ): Promise<UserObject>
  recoverFromPrivateKey(
    privateKey: string,
    password: string,
    progressCallback?
  ): Promise<UserObject>
  recoverFromSeed(
    seed: string,
    password: string,
    progressCallback?
  ): Promise<UserObject>
  signMsgHash(msgHash: string): Promise<Signature>
  encrypt(msg: string, theirPubKey: string): Promise<any>
  decrypt(encMsg: any, theirPubKey: string): Promise<any>
}
