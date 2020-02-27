import { TLSigner } from '../../src/signers/TLSigner'

import {
  Amount,
  MetaTransactionFees,
  RawTxObject,
  Signature,
  TxInfos
} from '../../src/typings'

import { BigNumber } from 'bignumber.js'
import {
  FAKE_AMOUNT,
  FAKE_SIGNED_MSG_HASH,
  FAKE_TX_HASH,
  FAKE_TX_INFOS
} from '../Fixtures'

/**
 * Mock TxSigner interface
 */
export class FakeTLSigner implements TLSigner {
  public address: string = '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'

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

  public getTxInfos(userAddress: string): Promise<TxInfos> {
    return Promise.resolve(FAKE_TX_INFOS)
  }

  public async getMetaTxFees(rawTx: RawTxObject): Promise<MetaTransactionFees> {
    return {
      baseFee: '0',
      gasPrice: '0',
      currencyNetworkOfFees: ''
    }
  }

  public async fillFeesAndNonce(rawTx: RawTxObject): Promise<RawTxObject> {
    rawTx.nonce = rawTx.nonce || 1
    rawTx.gasPrice = rawTx.gasPrice || new BigNumber(1)
    rawTx.baseFee = rawTx.baseFee || new BigNumber(1)
    rawTx.currencyNetworkOfFees = rawTx.currencyNetworkOfFees || undefined
    rawTx.totalFee = new BigNumber(1)
    return rawTx
  }
}
