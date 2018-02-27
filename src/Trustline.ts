import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import { TLOptions } from './typings'

export class Trustline {

  constructor (private event: Event,
               private user: User,
               private utils: Utils,
               private transaction: Transaction,
               private currencyNetwork: CurrencyNetwork) {
  }

  /**
   * Prepares a raw transaction to update a trustline
   * @param network address of currency network
   * @param debtor address of counterparty
   * @param creditLineGiven credit line given to counterparty as a value not raw,
   *                        i.e. 1.23 if network has to 2 decimals
   * @param creditLineReceived credit line received by counterparty as a value
   * @param decimals (optional) number of decimals
   * @param gasLimit (optional)
   * @param gasPrice (optional)
   */
  public prepareUpdate (
    network: string,
    debtor: string,
    creditLineGiven: number,
    creditLineReceived: number,
    { decimals, gasLimit, gasPrice }: TLOptions = {}
  ): Promise<any> {
    const { currencyNetwork, transaction, user, utils } = this
    const { calcRaw } = utils
    return currencyNetwork.getDecimals(network, decimals)
      .then(dec => transaction.prepFuncTx(
        user.address,
        network,
        'CurrencyNetwork',
        'updateTrustline',
        [ debtor, calcRaw(creditLineGiven, dec), calcRaw(creditLineReceived, dec) ],
        { gasPrice, gasLimit }
      ))
  }

  public prepareAccept (
    network: string,
    creditor: string,
    value: number,
    decimals?: number
  ): Promise<any> {
    const { currencyNetwork, transaction, user, utils } = this
    return currencyNetwork.getDecimals(network, decimals)
      .then(dec => transaction.prepFuncTx(
        user.address,
        network,
        'CurrencyNetwork',
        'updateTrustline',
        [ creditor, utils.calcRaw(value, dec) ]
      ))
  }

  public confirm (rawTx: string): Promise<string> {
    return this.user.signTx(rawTx)
      .then(signedTx => this.transaction.relayTx(signedTx))
  }

  public getAll (networkAddress: string): Promise<any[]> {
    const { user, utils, currencyNetwork } = this
    return Promise.all([
      utils.fetchUrl(`networks/${networkAddress}/users/${user.address}/trustlines`),
      currencyNetwork.getDecimals(networkAddress)
    ]).then(([ trustlines, decimals ]) => trustlines.map(t => ({
      ...t,
      balance: utils.formatAmount(t.balance, decimals),
      given: utils.formatAmount(t.given, decimals),
      leftGiven: utils.formatAmount(t.leftGiven, decimals),
      leftReceived: utils.formatAmount(t.leftReceived, decimals),
      received: utils.formatAmount(t.received, decimals)
    })))
  }

  public get (networkAddress: string, userAddressB: string): Promise<any> {
    const { user, utils, currencyNetwork } = this
    return Promise.all([
      utils.fetchUrl(`networks/${networkAddress}/users/${user.address}/trustlines/${userAddressB}`),
      currencyNetwork.getDecimals(networkAddress)
    ]).then(([ trustline, decimals ]) => ({
      ...trustline,
      balance: utils.formatAmount(trustline.balance, decimals),
      given: utils.formatAmount(trustline.given, decimals),
      leftGiven: utils.formatAmount(trustline.leftGiven, decimals),
      leftReceived: utils.formatAmount(trustline.leftReceived, decimals),
      received: utils.formatAmount(trustline.received, decimals)
    }))
  }

  public getRequests (networkAddress: string, filter?: object): Promise<any> {
    const mergedFilter = Object.assign({type: 'TrustlineUpdateRequest'}, filter)
    return this.event.get(networkAddress, mergedFilter)
  }

  public getUpdates (networkAddress: string, filter?: object): Promise<any> {
    const mergedFilter = Object.assign({type: 'TrustlineUpdate'}, filter)
    return this.event.get(networkAddress, mergedFilter)
  }
}
