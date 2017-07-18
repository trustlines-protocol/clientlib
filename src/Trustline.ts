import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'

export class Trustline {

  constructor (private user: User,
               private utils: Utils,
               private transaction: Transaction,
               private currencyNetwork: CurrencyNetwork) {
  }

  public prepareUpdate (debtor: string, value: number): Promise<string> {
    const { transaction, user } = this
    return transaction.prepareTransaction('updateCreditline', [ `0x${debtor}`, value ])
  }

  public prepareAccept (creditor: string) {
    const { transaction, user } = this
    return transaction.prepareTransaction('acceptCreditline', [ `0x${creditor}` ])
  }

  public getAll (): Promise<object[]> {
    const { user, utils, currencyNetwork } = this
    return utils.fetchUrl(`networks/${currencyNetwork.defaultNetwork}/users/0x${user.address}/trustlines`)
  }

  public get (userAddressB: string): Promise<object> {
    const { user, utils, currencyNetwork } = this
    return utils.fetchUrl(`networks/${currencyNetwork.defaultNetwork}/users/0x${user.address}/trustlines/${userAddressB}`)
  }
}
