import { User } from './User'
import { Utils } from './Utils'

export class CurrencyNetwork {

  public defaultNetwork: string
  public networks: string[]

  constructor (private user: User, private utils: Utils) {
  }

  public getAll (): Promise<any[]> {
    return this.utils.fetchUrl(`networks`)
  }

  public getInfo (networkAddress?: string): Promise<object> {
    const address = (networkAddress) ? networkAddress : this.defaultNetwork
    return this.utils.fetchUrl(`networks/${address}`)
  }

  public getUsers (networkAddress?: string): Promise<object[]> {
    const address = (networkAddress) ? networkAddress : this.defaultNetwork
    return this.utils.fetchUrl(`networks/${networkAddress}/users`)
  }

  public getUserOverview (networkAddress?: string, userAddress?: string): Promise<object> {
    const network = (networkAddress) ? networkAddress : this.defaultNetwork
    const user = (userAddress) ? userAddress : this.user.address
    return this.utils.fetchUrl(`networks/${network}/users/0x${user}`)
  }

}
