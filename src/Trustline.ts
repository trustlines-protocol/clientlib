import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'

export class Trustline {

  constructor (private user: User,
               private utils: Utils,
               private transaction: Transaction) {
  }

  public prepareUpdate (network: string, debtor: string, value: number): Promise<string> {
    const { transaction, user } = this
    return transaction.prepare(network, 'updateCreditline', [ `0x${debtor}`, value ])
  }

  public prepareAccept (network: string, creditor: string): Promise<string> {
    const { transaction, user } = this
    return transaction.prepare(network, 'acceptCreditline', [ `0x${creditor}` ])
  }

  public getAll (networkAddress: string): Promise<object[]> {
    const { user, utils } = this
    return utils.fetchUrl(`networks/${networkAddress}/users/0x${user.proxyAddress}/trustlines`)
  }

  public get (networkAddress: string, userAddressB: string): Promise<object> {
    const { user, utils } = this
    return utils.fetchUrl(`networks/${networkAddress}/users/0x${user.proxyAddress}/trustlines/${userAddressB}`)
  }
}
