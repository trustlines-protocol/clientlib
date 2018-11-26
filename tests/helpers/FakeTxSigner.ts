import { BigNumber } from 'bignumber.js'

import { TxSigner } from '../../src/signers/TxSigner'

import {
  Amount,
  RawTxObject,
  Signature,
  TxInfos,
  UserObject
} from '../../src/typings'

/**
 * Mock TxSigner interface
 */
export class FakeTxSigner implements TxSigner {
  public address: string
  public pubKey: string

  /**
   * Mock txSigner.getTxInfos
   */
  public async getTxInfos(userAddress: string): Promise<TxInfos> {
    return Promise.resolve({
      balance: new BigNumber('1000000'),
      gasPrice: new BigNumber('2000000'),
      nonce: 15
    })
  }

  /**
   * Mock txSigner.confirm
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    return Promise.resolve(
      '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b'
    )
  }

  public createAccount(): Promise<UserObject> {
    return
  }

  public loadAccount(serializedKeystore: string): Promise<UserObject> {
    return
  }

  public signMsgHash(msgHash: string): Promise<Signature> {
    return
  }

  public getBalance(): Promise<Amount> {
    return
  }

  public encrypt(msg: string, theirPubKey: string): Promise<any> {
    return
  }

  public decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    return
  }

  public showSeed(): Promise<string> {
    return
  }

  public recoverFromSeed(seed: string): Promise<UserObject> {
    return
  }

  public exportPrivateKey(): Promise<string> {
    return
  }
}
