import { Utils } from './Utils'

export class CurrencyNetwork {

  constructor (private utils: Utils) {
  }

  public getAll (): Promise<any[]> {
    return this.utils.fetchUrl(`networks`)
  }

  public getInfo (networkAddress: string): Promise<any> {
    return this.utils.fetchUrl(`networks/${networkAddress}`)
  }

  public getUsers (networkAddress: string): Promise<string[]> {
    return this.utils.fetchUrl(`networks/${networkAddress}/users`)
  }

  public getUserOverview (networkAddress: string, userAddress: string): Promise<any> {
    return this.utils.fetchUrl(`networks/${networkAddress}/users/${userAddress}`)
  }

}
