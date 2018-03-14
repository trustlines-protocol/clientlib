import { Utils } from './Utils'

import * as ethUtils from 'ethereumjs-util'

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

  public async isNetwork (contractAddress: string): Promise<any> {
    if (!this.utils.checkAddress(contractAddress)) {
      return Promise.reject(`${contractAddress} is not a valid address.`)
    }
    // TODO find another to check if given address is a currency network
    const currencyNetworks = await this.getAll()
    const networkAddresses = currencyNetworks.map(c => ethUtils.toChecksumAddress(c.address))
    return networkAddresses.indexOf(ethUtils.toChecksumAddress(contractAddress)) !== -1
  }
}
