import {
  TxInfos,
  RawTxObject
} from '../typings'

export interface TxSigner {
  getTxInfos (userAddress: string): Promise<TxInfos>,
  confirm (rawTx: RawTxObject)
}
