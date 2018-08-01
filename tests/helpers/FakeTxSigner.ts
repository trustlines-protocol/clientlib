import { BigNumber } from 'bignumber.js'
import { TxSigner } from '../../src/signers/TxSigner'
import {
  TxInfos,
  RawTxObject,
  Signature,
  UserObject,
  Amount
} from '../../src/typings'

/**
 * Mock TxSigner interface
 */
export class FakeTxSigner implements TxSigner {
  address: string
  pubKey: string

  /**
   * Mock txSigner.getTxInfos
   */
  async getTxInfos (userAddress: string): Promise<TxInfos> {
    return Promise.resolve({
      gasPrice: new BigNumber('2000000'),
      balance: new BigNumber('1000000'),
      nonce: 15
    })
  }

  /**
   * Mock txSigner.confirm
   */
  async confirm (rawTx: RawTxObject): Promise<string> {
    return Promise.resolve(
      '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b'
    )
  }

  createAccount (): Promise<UserObject> {
    return
  }

  loadAccount (serializedKeystore: string): Promise<UserObject> {
    return
  }

  signMsgHash (msgHash: string): Promise<Signature> {
    return
  }

  getBalance (): Promise<Amount> {
    return
  }

  encrypt (msg: string, theirPubKey: string): Promise<any> {
    return
  }

  decrypt (encMsg: any, theirPubKey: string): Promise<any> {
    return
  }

  showSeed (): Promise<string> {
    return
  }

  recoverFromSeed (seed: string): Promise<UserObject> {
    return
  }

  exportPrivateKey (): Promise<string> {
    return
  }

}
