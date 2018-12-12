import { BigNumber } from 'bignumber.js'

import { Transaction } from '../../src/Transaction'

import {
  RawTxObject,
  TxObjectInternal,
  TxOptionsInternal
} from '../../src/typings'

import {
  FAKE_FUNC_TX_OBJECT_INTERNAL,
  FAKE_TX_HASH,
  FAKE_VALUE_TX_OBJECT_INTERNAL
} from '../Fixtures'

/**
 * Mock Transaction class
 */
export class FakeTransaction extends Transaction {
  public errors: any = {}

  public async prepValueTx(
    senderAddress: string,
    receiverAddress: string,
    rawValue: BigNumber,
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    if (this.errors.prepValueTx) {
      throw new Error('Mocked error in transaction.prepValueTx()!')
    }
    return Promise.resolve(FAKE_VALUE_TX_OBJECT_INTERNAL)
  }

  public async prepFuncTx(
    userAddress: string,
    contractAddress: string,
    contractName: string,
    functionName: string,
    args: any[],
    options: TxOptionsInternal = {}
  ): Promise<TxObjectInternal> {
    if (this.errors.prepFuncTx) {
      throw new Error('Mocked error in transaction.prepFuncTx()!')
    }
    return Promise.resolve(FAKE_FUNC_TX_OBJECT_INTERNAL)
  }

  public async confirm(rawTx: RawTxObject): Promise<any> {
    if (this.errors.confirm) {
      throw new Error('Mocked error in transaction.confirm()!')
    }
    return Promise.resolve(FAKE_TX_HASH)
  }

  public setError(functionName) {
    this.errors[functionName] = true
  }
}
