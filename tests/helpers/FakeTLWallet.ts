import { TLWallet } from '../../src/wallets/TLWallet'

import { UserObject } from '../../src/typings'

import {
  ETHERS_JSON_KEYSTORE_1,
  FAKE_ACCOUNT,
  FAKE_ENC_OBJECT,
  FAKE_PRIVATE_KEY,
  FAKE_SEED
} from '../Fixtures'
import { FakeTLSigner } from './FakeTLSigner'

/**
 * Mock TLWallet interface
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
      throw new Error('Mocked error in wallet.createAccount()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
  }

  public deployIdentity(): Promise<string> {
    if (this.errors.deployIdentity) {
      throw new Error('Mocked error in wallet.deployIdentity()!')
    }
    return Promise.resolve(this.address)
  }

  public async isIdentityDeployed(): Promise<boolean> {
    if (this.errors.isIdentityDeployed) {
      throw new Error('Mocked error in wallet.isIdentityDeployed()!')
    }
    return false
  }

  public loadAccount(): Promise<void> {
    if (this.errors.loadAccount) {
      throw new Error('Mocked error in wallet.loadAccount()!')
    }
    return Promise.resolve()
  }

  public async encryptWallet(): Promise<string> {
    if (this.errors.encryptWallet) {
      throw new Error('Mocked error in wallet.encryptWallet()!')
    }
    return Promise.resolve(ETHERS_JSON_KEYSTORE_1)
  }

  public encrypt(msg: string, theirPubKey: string): Promise<any> {
    if (this.errors.encrypt) {
      throw new Error('Mocked error in wallet.encrypt()!')
    }
    return Promise.resolve(FAKE_ENC_OBJECT)
  }

  public decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    if (this.errors.decrypt) {
      throw new Error('Mocked error in wallet.decrypt()!')
    }
    return Promise.resolve('Fake decrypted message!')
  }

  public showSeed(): Promise<string> {
    if (this.errors.showSeed) {
      throw new Error('Mocked error in wallet.showSeed()!')
    }
    return Promise.resolve(FAKE_SEED)
  }

  public recoverFromEncryptedWallet(): Promise<UserObject> {
    if (this.errors.recoverFromEncryptedWallet) {
      throw new Error('Mocked error in wallet.recoverFromEncryptedWallet()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
  }

  public recoverFromSeed(): Promise<UserObject> {
    if (this.errors.recoverFromSeed) {
      throw new Error('Mocked error in wallet.recoverFromSeed()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
  }

  public recoverFromPrivateKey(): Promise<UserObject> {
    if (this.errors.recoverFromPrivateKey) {
      throw new Error('Mocked error in wallet.recoverFromPrivateKey()!')
    }
    return Promise.resolve(FAKE_ACCOUNT)
  }

  public exportPrivateKey(): Promise<string> {
    if (this.errors.exportPrivateKey) {
      throw new Error('Mocked error in wallet.exportPrivateKey()!')
    }
    return Promise.resolve(FAKE_PRIVATE_KEY)
  }

  public getAddress(): Promise<string> {
    if (this.errors.getAddress) {
      throw new Error('Mocked error in wallet.getAddress()!')
    }
    return Promise.resolve(FAKE_ACCOUNT.address)
  }

  public setError(functionName: string) {
    this.errors[functionName] = true
  }
}
