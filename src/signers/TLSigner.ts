import {
  Amount,
  MetaTransactionFees,
  RawTxObject,
  Signature,
  TransactionStatusObject
} from '../typings'

/**
 * Interface for different signer strategies.
 */
export interface TLSigner {
  getAddress(): Promise<string>
  getBalance(): Promise<Amount>
  signMsgHash(msgHash: string): Promise<Signature>
  signMessage(message: string | ArrayLike<number>): Promise<Signature>
  hashTx(rawTx: RawTxObject): Promise<string>
  confirm(rawTx: RawTxObject): Promise<string>
  fillFeesAndNonce(rawTx: RawTxObject): Promise<RawTxObject>
  getTxStatus(txHash: string | RawTxObject): Promise<TransactionStatusObject>
  getMetaTxFees(rawTx: RawTxObject): Promise<MetaTransactionFees>
}
