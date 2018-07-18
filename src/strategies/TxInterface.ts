import { BigNumber } from 'bignumber.js'

import {
  TxInfos,
  RawTx
} from '../typings'

export interface TxInterface {
  getTxInfos (userAddress: string): Promise<TxInfos>,
  confirm (rawTx: RawTx)
}
