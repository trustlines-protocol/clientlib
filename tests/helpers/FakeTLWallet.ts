import { BigNumber } from 'bignumber.js'

import { TLWallet } from '../../src/signers/TLWallet'

import {
  Amount,
  RawTxObject,
  Signature,
  TxInfos,
  UserObject
} from '../../src/typings'

import {
  FAKE_ACCOUNT,
  FAKE_AMOUNT,
  FAKE_ENC_OBJECT,
  FAKE_PRIVATE_KEY,
  FAKE_SEED,
  FAKE_SIGNED_MSG_HASH,
  FAKE_TX_HASH
} from '../Fixtures'

/**
 * Mock TxSigner interface
 */
export class FakeTLWallet implements TLWallet {
  public address: string = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
  public pubKey: string =
    'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472'

  public errors

  constructor() {
    this.errors = []
  }

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
    if (this.errors.confirm) {
      throw new Error('Mocked error in signer.confirm()!')
    }
    return Promise.resolve(FAKE_TX_HASH)
  }

  public createAccount(): Promise<UserObject> {
    if (this.errors.createAccount) {
      throw new Error('Mocked error in signer.createAccount()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
  }

  public loadAccount(serializedKeystore: string): Promise<UserObject> {
    if (this.errors.loadAccount) {
      throw new Error('Mocked error in signer.loadAccount()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
  }

  public signMsgHash(msgHash: string): Promise<Signature> {
    if (this.errors.signMsgHash) {
      throw new Error('Mocked error in signer.signMsgHash()!')
    }
    return Promise.resolve(FAKE_SIGNED_MSG_HASH)
  }

  public getBalance(): Promise<Amount> {
    if (this.errors.getBalance) {
      throw new Error('Mocked error in signer.getBalance()!')
    }
    return Promise.resolve(FAKE_AMOUNT)
  }

  public encrypt(msg: string, theirPubKey: string): Promise<any> {
    if (this.errors.encrypt) {
      throw new Error('Mocked error in signer.encrypt()!')
    }
    return Promise.resolve(FAKE_ENC_OBJECT)
  }

  public decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    if (this.errors.decrypt) {
      throw new Error('Mocked error in signer.decrypt()!')
    }
    return Promise.resolve('Fake decrypted message!')
  }

  public showSeed(): Promise<string> {
    if (this.errors.showSeed) {
      throw new Error('Mocked error in signer.showSeed()!')
    }
    return Promise.resolve(FAKE_SEED)
  }

  public recoverFromSeed(seed: string): Promise<UserObject> {
    if (this.errors.recoverFromSeed) {
      throw new Error('Mocked error in signer.recoverFromSeed()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
  }

  public exportPrivateKey(): Promise<string> {
    if (this.errors.exportPrivateKey) {
      throw new Error('Mocked error in signer.exportPrivateKey()!')
    }
    return Promise.resolve(FAKE_PRIVATE_KEY)
  }

  public setError(functionName: string) {
    this.errors[functionName] = true
  }
}
