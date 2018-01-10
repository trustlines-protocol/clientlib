import { Utils } from './Utils'

export class CurrencyNetwork {

  constructor (private utils: Utils) {
  }

  public getAll (): Promise<any[]> {
    return this.utils.fetchUrl(`networks`)
  }

  public getInfo (networkAddress: string): Promise<any> {
    if (!this.utils.checkAddress(networkAddress)) {
      return Promise.reject(`${networkAddress} is not a valid address.`)
    }
    return this.utils.fetchUrl(`networks/${networkAddress}`)
  }

  public getUsers (networkAddress: string): Promise<string[]> {
    if (!this.utils.checkAddress(networkAddress)) {
      return Promise.reject(`${networkAddress} is not a valid address.`)
    }
    return this.utils.fetchUrl(`networks/${networkAddress}/users`)
  }

  public getUserOverview (networkAddress: string, userAddress: string): Promise<any> {
    if (!this.utils.checkAddress(networkAddress)) {
      return Promise.reject(`${networkAddress} is not a valid address.`)
    }
    return this.utils.fetchUrl(`networks/${networkAddress}/users/${userAddress}`)
  }

  public getDecimals (networkAddress: string, decimals?: number): Promise<any> {
    if (!this.utils.checkAddress(networkAddress)) {
      return Promise.reject(`${networkAddress} is not a valid address.`)
    }
    return Promise.resolve(
      ((typeof decimals === 'number') && decimals) ||
      // TODO replace with list of known currency network in clientlib
      this.utils.fetchUrl(`networks/${networkAddress}`)
        .then(network => network.decimals)
    )
  }
}
