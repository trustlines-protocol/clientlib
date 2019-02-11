import { TLSigner } from '../../src/signers/TLSigner'

import { Amount, RawTxObject, Signature } from '../../src/typings'

import { FAKE_AMOUNT, FAKE_SIGNED_MSG_HASH, FAKE_TX_HASH } from '../Fixtures'

/**
 * Mock TxSigner interface
 */
export class FakeTLSigner implements TLSigner {
  public address: string = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
  public pubKey: string =
    'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472'

  public errors

  constructor() {
    this.errors = []
  }

  public async getAddress(): Promise<string> {
    if (this.errors.getAddress) {
      throw new Error('Mocked error in signer.getAddress()!')
    }
    return Promise.resolve(this.address)
  }

  public async confirm(rawTx: RawTxObject): Promise<string> {
    if (this.errors.confirm) {
      throw new Error('Mocked error in signer.confirm()!')
    }
    return Promise.resolve(FAKE_TX_HASH)
  }

  public async signMsgHash(msgHash: string): Promise<Signature> {
    if (this.errors.signMsgHash) {
      throw new Error('Mocked error in signer.signMsgHash()!')
    }
    return Promise.resolve(FAKE_SIGNED_MSG_HASH)
  }

  public async signMessage(
    message: string | ArrayLike<number>
  ): Promise<Signature> {
    if (this.errors.signMessage) {
      throw new Error('Mocked error in signer.signMessage()!')
    }
    return Promise.resolve(FAKE_SIGNED_MSG_HASH)
  }

  public async getBalance(): Promise<Amount> {
    if (this.errors.getBalance) {
      throw new Error('Mocked error in signer.getBalance()!')
    }
    return Promise.resolve(FAKE_AMOUNT)
  }

  public setError(functionName: string) {
    this.errors[functionName] = true
  }
}
