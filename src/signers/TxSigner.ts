import {
  TxInfos,
  RawTxObject
} from '../typings'

/**
 * Interface for different signer strategies.
 */
export interface TxSigner {
  getTxInfos (userAddress: string): Promise<TxInfos>,
  confirm (rawTx: RawTxObject)
}
