import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'

export class Payment {

  constructor (private user: User,
               private utils: Utils,
               private transaction: Transaction,
               private currencyNetwork: CurrencyNetwork) {
  }

  public prepareTransfer (receiver: string, value: number): Promise<any> {
    return this.getPath(this.user.address, receiver, value)
      .then((response) => {
        if (response.path.length > 0) {
          return this.transaction.prepareTransaction(
            'mediatedTransfer',
            [ '0x' + receiver, value, response.path.slice(1) ]
          )
        } else {
          return Promise.reject<string>('Could not find a path with enough capacity')
        }
      })
  }

  public getPath (accountA: string, accountB: string, value: number): Promise<any> {
    const url = `networks/${this.currencyNetwork.defaultNetwork}/users/0x${accountA}/path/0x${accountB}`
    return this.utils.fetchUrl(url)
  }

}
