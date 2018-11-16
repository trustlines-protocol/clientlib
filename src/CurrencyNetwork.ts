import * as ethUtils from 'ethereumjs-util'

import { Utils } from './Utils'

import {
  NetworkDetails,
  NetworkDetailsRaw,
  UserOverview,
  UserOverviewRaw,
  DecimalsOptions,
  DecimalsObject
} from './typings'

/**
 * The CurrencyNetwork class contains all functions relevant for retrieving
 * currency network related information.
 */
export class CurrencyNetwork {
  private _utils: Utils

  constructor(utils: Utils) {
    this._utils = utils
  }

  /**
   * Returns all registered currency networks.
   */
  public async getAll(): Promise<NetworkDetails[]> {
    const networks = await this._utils.fetchUrl<NetworkDetailsRaw[]>(`networks`)
    return networks.map(network => ({
      ...network,
      defaultInterestRate: this._utils.formatToAmount(
        network.defaultInterestRate,
        network.interestRateDecimals
      )
    }))
  }

  /**
   * Returns detailed information of specific currency network.
   * @param networkAddress Address of a currency network.
   * @returns A network object with information about name, decimals, number of users and address.
   */
  public async getInfo(networkAddress: string): Promise<NetworkDetails> {
    await this._checkAddresses([networkAddress])
    const networkInfo = await this._utils.fetchUrl<NetworkDetailsRaw>(
      `networks/${networkAddress}`
    )
    return {
      ...networkInfo,
      defaultInterestRate: this._utils.formatToAmount(
        networkInfo.defaultInterestRate,
        networkInfo.interestRateDecimals
      )
    }
  }

  /**
   * Returns all addresses of users in a currency network.
   * @param networkAddress Address of a currency network.
   */
  public async getUsers(networkAddress: string): Promise<string[]> {
    await this._checkAddresses([networkAddress])
    return this._utils.fetchUrl<string[]>(`networks/${networkAddress}/users`)
  }

  /**
   * Returns overview of a user in a specific currency network.
   * @param networkAddress Address of a currency network.
   * @param userAddress Address of a user.
   */
  public async getUserOverview(
    networkAddress: string,
    userAddress: string
  ): Promise<UserOverview> {
    await this._checkAddresses([networkAddress, userAddress])
    const [overview, { networkDecimals }] = await Promise.all([
      this._utils.fetchUrl<UserOverviewRaw>(
        `networks/${networkAddress}/users/${userAddress}`
      ),
      this.getDecimals(networkAddress)
    ])
    return {
      balance: this._utils.formatToAmount(overview.balance, networkDecimals),
      given: this._utils.formatToAmount(overview.given, networkDecimals),
      received: this._utils.formatToAmount(overview.received, networkDecimals),
      leftGiven: this._utils.formatToAmount(
        overview.leftGiven,
        networkDecimals
      ),
      leftReceived: this._utils.formatToAmount(
        overview.leftReceived,
        networkDecimals
      )
    }
  }

  /**
   * Returns the network decimals and interest decimals specified in a currency network.
   * @param networkAddress Address of currency network.
   * @param decimals If decimals are known they can be provided manually.
   */
  public async getDecimals(
    networkAddress: string,
    decimalsOptions: DecimalsOptions = {}
  ): Promise<DecimalsObject> {
    const { networkDecimals, interestRateDecimals } = decimalsOptions
    const decimalsObject = { networkDecimals, interestRateDecimals }
    try {
      await this._checkAddresses([networkAddress])
      if (
        typeof networkDecimals === 'undefined' ||
        typeof networkDecimals !== 'number' ||
        typeof interestRateDecimals === 'undefined' ||
        typeof interestRateDecimals !== 'number'
      ) {
        // TODO replace with local list of known currency networks
        const network = await this.getInfo(networkAddress)
        decimalsObject.networkDecimals = network.decimals
        decimalsObject.interestRateDecimals = network.interestRateDecimals
      }
      return decimalsObject
    } catch (error) {
      if (error.message.includes('Status 404')) {
        throw new Error(
          `${networkAddress} seems not to be a network address. Decimals have to be explicit.`
        )
      }
      throw error
    }
  }

  /**
   * Returns true or false whether given address is a registered currency network.
   * @param contractAddress Address which should be checked.
   */
  public async isNetwork(contractAddress: string): Promise<boolean> {
    await this._checkAddresses([contractAddress])
    // TODO find another to check if given address is a currency network
    const currencyNetworks = await this.getAll()
    const networkAddresses = currencyNetworks.map(c =>
      ethUtils.toChecksumAddress(c.address)
    )
    return (
      networkAddresses.indexOf(ethUtils.toChecksumAddress(contractAddress)) !==
      -1
    )
  }

  /**
   * Checks if given addresses are valid ethereum addresses.
   * @param addresses Array of addresses that should be checked.
   */
  private async _checkAddresses(addresses: string[]): Promise<boolean> {
    for (let address of addresses) {
      if (!this._utils.checkAddress(address)) {
        throw new Error(`${address} is not a valid address.`)
      }
    }
    return true
  }
}
