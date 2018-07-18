import {
  TxInfos,
  RawTxObject
} from '../typings'

export interface TxInterface {
  getTxInfos (userAddress: string): Promise<TxInfos>,
  confirm (rawTx: RawTxObject)
}
