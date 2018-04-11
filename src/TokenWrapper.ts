import { Utils } from './Utils'
import { User } from './User'
import { CurrencyNetwork } from './CurrencyNetwork'
import { TxOptions } from './typings'
import { Transaction } from './Transaction'

export class TokenWrapper {
  constructor (
    private user: User,
    private utils: Utils,
    private currencyNetwork: CurrencyNetwork,
    private transaction: Transaction
  ) {}

  public getAll (): Promise<any> {
    return this.utils.fetchUrl('exchange/eth')
  }

  public prepDeposit (
    tokenAddress: string,
    value: number | string,
    { gasPrice, gasLimit }: TxOptions = {}
  ): Promise<any> {
    const { transaction, user, utils } = this
    return transaction.prepFuncTx(
      user.address,
      tokenAddress,
      'UnwEth',
      'deposit',
      [],
      {
        gasPrice,
        gasLimit,
        value: utils.convertEthToWei(value)
      }
    ).catch(e => Promise.reject(e))
  }

  public confirm (rawTx): Promise<string> {
    const { transaction, user } = this
    return user.signTx(rawTx).then(signedTx => transaction.relayTx(signedTx))
  }
}
