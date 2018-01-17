import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'

export class Trustline {

  constructor (private event: Event,
               private user: User,
               private utils: Utils,
               private transaction: Transaction,
               private currencyNetwork: CurrencyNetwork) {
  }

  public prepareUpdate (
    network: string,
    debtor: string,
    value: number,
    decimals?: number
  ): Promise<any> {
    const { currencyNetwork, transaction, user, utils } = this
    return currencyNetwork.getDecimals(network, decimals)
      .then(dec => transaction.prepFuncTx(
        user.address,
        network,
        'CurrencyNetwork',
        'updateCreditline',
        [ debtor, utils.calcRaw(value, dec) ]
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
        'acceptCreditline',
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
    const mergedFilter = Object.assign({type: 'CreditlineUpdateRequest'}, filter)
    return this.event.get(networkAddress, mergedFilter)
  }

  public getUpdates (networkAddress: string, filter?: object): Promise<any> {
    const mergedFilter = Object.assign({type: 'CreditlineUpdate'}, filter)
    return this.event.get(networkAddress, mergedFilter)
  }
}
