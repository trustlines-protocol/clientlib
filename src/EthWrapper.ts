import { Utils } from './Utils'
import { User } from './User'
import { CurrencyNetwork } from './CurrencyNetwork'
import { TxOptions } from './typings'
import { Transaction } from './Transaction'
import { EventFilterOptions } from './typings'

export class EthWrapper {
  constructor (
    private user: User,
    private utils: Utils,
    private currencyNetwork: CurrencyNetwork,
    private transaction: Transaction
  ) {}

  public getAll (): Promise<any> {
    return this.utils.fetchUrl('exchange/eth')
  }

  public async getBalance (tokenAddress: string): Promise<any> {
    const { user, utils } = this
    try {
      const balance = await utils.fetchUrl(`tokens/${tokenAddress}/users/${user.address}/balance`)
      const rawBalance = utils.calcRaw(balance, 18)
      return utils.formatAmount(rawBalance, 18)
    } catch (error) {
      return Promise.reject(error)
    }
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
    return user.signTx(rawTx)
      .then(signedTx => transaction.relayTx(signedTx))
  }

  public async getLogs (
    tokenAddress: string,
    { type, fromBlock, toBlock }: EventFilterOptions = {}
  ): Promise<any> {
    const { user, utils } = this
    const baseUrl = `tokens/${tokenAddress}/users/${user.address}/events`
    const parameterUrl = utils.buildUrl(baseUrl, { type, fromBlock, toBlock })

    try {
      const events = await utils.fetchUrl(parameterUrl)
      return events.map(event => utils.formatEvent(event, 18))
    } catch (error) {
      return Promise.reject(error)
    }
  }
}
