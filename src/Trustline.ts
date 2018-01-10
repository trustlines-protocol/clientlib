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

  public prepareUpdate (network: string, debtor: string, value: number): Promise<any> {
    const { transaction, user } = this
    return transaction.prepFuncTx(
      user.address,
      network,
      'CurrencyNetwork',
      'updateCreditline',
      [ debtor, value ]
    )
  }

  public prepareAccept (network: string, creditor: string, value: number): Promise<any> {
    const { transaction, user } = this
    return transaction.prepFuncTx(
      user.address,
      network,
      'CurrencyNetwork',
      'acceptCreditline',
      [ creditor, value ]
    )
  }

  public confirm (rawTx: string): Promise<string> {
    return this.user.signTx(rawTx).then(signedTx => this.transaction.relayTx(signedTx))
  }

  public getAll (networkAddress: string): Promise<any[]> {
    const { user, utils } = this
    return utils.fetchUrl(`networks/${networkAddress}/users/${user.address}/trustlines`)
  }

  public get (networkAddress: string, userAddressB: string): Promise<any> {
    const { user, utils } = this
    return utils.fetchUrl(`networks/${networkAddress}/users/${user.address}/trustlines/${userAddressB}`)
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
