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
    return Promise.all([
      this.utils.fetchUrl(`networks/${networkAddress}/users/${userAddress}`),
      this.getDecimals(networkAddress)
    ]).then(([ overview, decimals ]) => ({
      ...overview,
      balance: this.utils.formatAmount(overview.balance, decimals),
      given: this.utils.formatAmount(overview.given, decimals),
      received: this.utils.formatAmount(overview.received, decimals),
      leftGiven: this.utils.formatAmount(overview.leftGiven, decimals),
      leftReceived: this.utils.formatAmount(overview.leftReceived, decimals)
    }))
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
