import { TLWallet } from '../../src/wallets/TLWallet'

import { UserObject } from '../../src/typings'

import {
  FAKE_ACCOUNT,
  FAKE_ENC_OBJECT,
  FAKE_PRIVATE_KEY,
  FAKE_SEED
} from '../Fixtures'
import { FakeTLSigner } from './FakeTLSigner'

/**
 * Mock TxSigner interface
 */
export class FakeTLWallet extends FakeTLSigner implements TLWallet {
  public address: string = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
  public pubKey: string =
    'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472'

  public errors

  constructor() {
    super()
  }

  public createAccount(): Promise<UserObject> {
    if (this.errors.createAccount) {
      throw new Error('Mocked error in signer.createAccount()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
  }

  public deployIdentity(): Promise<string> {
    if (this.errors.deployIdentity) {
      throw new Error('Mocked error in signer.deployIdentity()!')
    }
    return Promise.resolve(this.address)
  }

  public async isIdentityDeployed(): Promise<boolean> {
    if (this.errors.isIdentityDeployed) {
      throw new Error('Mocked error in signer.isIdentityDeployed()!')
    }
    return false
  }

  public loadAccount(serializedKeystore: string): Promise<UserObject> {
    if (this.errors.loadAccount) {
      throw new Error('Mocked error in signer.loadAccount()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
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

  public getAddress(): Promise<string> {
    if (this.errors.getAddress) {
      throw new Error('Mocked error in signer.getAddress()!')
    }
    return Promise.resolve(FAKE_ACCOUNT.address)
  }

  public setError(functionName: string) {
    this.errors[functionName] = true
  }
}
