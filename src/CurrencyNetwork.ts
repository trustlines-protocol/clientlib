import * as ethUtils from 'ethereumjs-util'

import { Utils } from './Utils'

import {
  Network,
  NetworkDetails,
  UserOverview,
  UserOverviewRaw
} from './typings'

/**
 * The CurrencyNetwork class contains all functions relevant for retrieving
 * currency network related information.
 */
export class CurrencyNetwork {
  private _utils: Utils

  constructor (utils: Utils) {
    this._utils = utils
  }

  /**
   * Returns all registered currency networks.
   */
  public getAll (): Promise<Network[]> {
    return this._utils.fetchUrl<Network[]>(`networks`)
  }

  /**
   * Returns detailed information of specific currency network.
   * @param networkAddress Address of a currency network.
   * @returns A network object with information about name, decimals, number of users and address.
   */
  public async getInfo (networkAddress: string): Promise<NetworkDetails> {
    await this._checkAddresses([networkAddress])
    return this._utils.fetchUrl<NetworkDetails>(`networks/${networkAddress}`)
  }

  /**
   * Returns all addresses of users in a currency network.
   * @param networkAddress Address of a currency network.
   */
  public async getUsers (networkAddress: string): Promise<string[]> {
    await this._checkAddresses([networkAddress])
    return this._utils.fetchUrl<string[]>(`networks/${networkAddress}/users`)
  }

  /**
   * Returns overview of a user in a specific currency network.
   * @param networkAddress Address of a currency network.
   * @param userAddress Address of a user.
   */
  public async getUserOverview (
    networkAddress: string,
    userAddress: string
  ): Promise<UserOverview> {
    await this._checkAddresses([networkAddress, userAddress])
    const [ overview, decimals ] = await Promise.all([
      this._utils.fetchUrl<UserOverviewRaw>(`networks/${networkAddress}/users/${userAddress}`),
      this.getDecimals(networkAddress)
    ])
    return {
      balance: this._utils.formatAmount(overview.balance, decimals),
      given: this._utils.formatAmount(overview.given, decimals),
      received: this._utils.formatAmount(overview.received, decimals),
      leftGiven: this._utils.formatAmount(overview.leftGiven, decimals),
      leftReceived: this._utils.formatAmount(overview.leftReceived, decimals)
    }
  }

  /**
   * Returns the decimals specified in a currency network.
   * @param networkAddress Address of currency network.
   * @param decimals If decimals are known they can be provided manually.
   */
  public async getDecimals (networkAddress: string, decimals?: number): Promise<number> {
    await this._checkAddresses([networkAddress])
    const isNetwork = await this.isNetwork(networkAddress)
    if (isNetwork) {
      return Promise.resolve(
        ((typeof decimals === 'number') && decimals) ||
        // TODO replace with list of known currency network in clientlib
        this._utils.fetchUrl<NetworkDetails>(`networks/${networkAddress}`)
          .then(network => network.decimals)
      )
    } else {
      if ((typeof decimals === 'number') && decimals) {
        return decimals
      } else {
        return Promise.reject(`${networkAddress} is a token address. Decimals have to be explicit.`)
      }
    }
  }

  /**
   * Returns true or false whether given address is a registered currency network.
   * @param contractAddress Address which should be checked.
   */
  public async isNetwork (contractAddress: string): Promise<boolean> {
    await this._checkAddresses([contractAddress])
    // TODO find another to check if given address is a currency network
    const currencyNetworks = await this.getAll()
    const networkAddresses = currencyNetworks.map(c => ethUtils.toChecksumAddress(c.address))
    return networkAddresses.indexOf(ethUtils.toChecksumAddress(contractAddress)) !== -1
  }

  /**
   * Checks if given addresses are valid ethereum addresses.
   * @param addresses Array of addresses that should be checked.
   */
  private async _checkAddresses (addresses: string[]): Promise<boolean> {
    for (let address of addresses) {
      if (!this._utils.checkAddress(address)) {
        throw new Error(`${address} is not a valid address.`)
      }
    }
    return
  }
}
