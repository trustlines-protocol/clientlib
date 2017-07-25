import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'

export class Trustline {

  constructor (private event: Event,
               private user: User,
               private utils: Utils,
               private transaction: Transaction) {
  }

  public prepareUpdate (network: string, debtor: string, value: number): Promise<string> {
    const { transaction, user } = this
    return transaction.prepare(user.proxyAddress, network, 'updateCreditline', [ debtor, value ])
  }

  public prepareAccept (network: string, creditor: string): Promise<string> {
    const { transaction, user } = this
    return transaction.prepare(user.proxyAddress, network, 'acceptCreditline', [ creditor ])
  }

  public confirm (rawTx: string): Promise<string> {
    return this.user.signTx(rawTx).then(signedTx => this.transaction.relayTx(signedTx))
  }

  public getAll (networkAddress: string): Promise<object[]> {
    const { user, utils } = this
    return utils.fetchUrl(`networks/${networkAddress}/users/${user.proxyAddress}/trustlines`)
  }

  public get (networkAddress: string, userAddressB: string): Promise<object> {
    const { user, utils } = this
    return utils.fetchUrl(`networks/${networkAddress}/users/${user.proxyAddress}/trustlines/${userAddressB}`)
  }

  public getRequests (networkAddress: string, filter?: object): Promise<object> {
    const mergedFilter = Object.assign({type: 'CreditlineUpdateRequest'}, filter)
    return this.event.get(networkAddress, mergedFilter)
      .then(requests => requests.map(r => Object.assign({}, {blockNumber: r.blockNumber}, r.event)))
  }

  public getUpdates (networkAddress: string, filter?: object): Promise<object> {
    const mergedFilter = Object.assign({type: 'CreditlineUpdate'}, filter)
    return this.event.get(networkAddress, mergedFilter)
      .then(updates => updates.map(u => Object.assign({}, {blockNumber: u.blockNumber}, u.event)))
  }
}
