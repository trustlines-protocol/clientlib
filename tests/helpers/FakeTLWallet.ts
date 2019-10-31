import { TLWallet } from '../../src/wallets/TLWallet'

import { TLWalletData } from '../../src/typings'

import {
  ETHERS_JSON_KEYSTORE_1,
  FAKE_ENC_OBJECT,
  FAKE_PRIVATE_KEY,
  FAKE_SEED,
  TL_WALLET_DATA
} from '../Fixtures'
import { FakeTLSigner } from './FakeTLSigner'

/**
 * Mock TLWallet interface
 */
export class FakeTLWallet extends FakeTLSigner implements TLWallet {
  public address: string = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'

  public errors

  constructor() {
    super()
  }

  public getWalletData(): Promise<TLWalletData> {
    if (this.errors.getWalletData) {
      throw new Error('Mocked error in wallet.getWalletData()!')
    }
    return Promise.resolve(TL_WALLET_DATA)
  }

  public create(): Promise<TLWalletData> {
    if (this.errors.createWalletData) {
      throw new Error('Mocked error in wallet.create()!')
    }
    return Promise.resolve(TL_WALLET_DATA)
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

  public loadFrom(): Promise<void> {
    if (this.errors.loadFrom) {
      throw new Error('Mocked error in wallet.loadFrom()!')
    }
    return Promise.resolve()
  }

  public async encryptToSerializedKeystore(): Promise<string> {
    if (this.errors.encryptWalletDataToSerializedKeystore) {
      throw new Error('Mocked error in wallet.encryptToSerializedKeystore()!')
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

  public recoverFromEncryptedKeystore(): Promise<TLWalletData> {
    if (this.errors.recoverWalletDataFromEncryptedKeystore) {
      throw new Error('Mocked error in wallet.recoverFromEncryptedKeystore()!')
    }
    return Promise.resolve(TL_WALLET_DATA)
  }

  public recoverFromSeed(): Promise<TLWalletData> {
    if (this.errors.recoverWalletDataFromSeed) {
      throw new Error('Mocked error in wallet.recoverFromSeed()!')
    }
    return Promise.resolve(TL_WALLET_DATA)
  }

  public recoverFromPrivateKey(): Promise<TLWalletData> {
    if (this.errors.recoverWalletDataFromPrivateKey) {
      throw new Error('Mocked error in wallet.recoverFromPrivateKey()!')
    }
    return Promise.resolve(TL_WALLET_DATA)
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
    return Promise.resolve(TL_WALLET_DATA.address)
  }

  public setError(functionName: string) {
    this.errors[functionName] = true
  }
}
