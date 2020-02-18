import * as ethUtils from 'ethereumjs-util'

import { TLProvider } from './providers/TLProvider'

import utils from './utils'

import {
  DecimalsMap,
  DecimalsObject,
  DecimalsOptions,
  NetworkDetails,
  NetworkDetailsRaw,
  UserOverview,
  UserOverviewRaw
} from './typings'

/**
 * The [[CurrencyNetwork]] class contains all functions relevant for retrieving currency network related information.
 * It is meant to be called via a [[TLNetwork]] instance like:
 * ```typescript
 * const tlNetwork = new TLNetwork(...)
 *
 * // Get all networks
 * tlNetwork.currencyNetwork.getAll().then(
 *  networks => console.log("All networks:", networks)
 * )
 * ```
 */
export class CurrencyNetwork {
  /**
   * @hidden
   * Returns general and interest rate decimals for given currency network.
   * @param networkAddress Currency network to get decimals for.
   * @param decimalsOptions Optional provided decimals if known.
   */
  public getDecimals: (
    networkAddress: string,
    decimalsOptions?: DecimalsOptions
  ) => Promise<DecimalsObject>

  private provider: TLProvider

  /** @hidden */
  constructor(provider: TLProvider) {
    this.provider = provider
    this.getDecimals = this._getDecimalsCached()
  }

  /**
   * Returns all registered currency networks.
   */
  public async getAll(): Promise<NetworkDetails[]> {
    const networks = await this.provider.fetchEndpoint<NetworkDetailsRaw[]>(
      `networks`
    )
    return networks.map(network => ({
      ...network,
      defaultInterestRate: utils.formatToAmount(
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
    const networkInfo = await this.provider.fetchEndpoint<NetworkDetailsRaw>(
      `networks/${networkAddress}`
    )
    return {
      ...networkInfo,
      defaultInterestRate: utils.formatToAmount(
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
    return this.provider.fetchEndpoint<string[]>(
      `networks/${networkAddress}/users`
    )
  }

  /**
   * Returns overview of a user in a specific currency network.
   * @param networkAddress Address of a currency network.
   * @param userAddress Address of a user.
   */
  public async getUserOverview(
    networkAddress: string,
    userAddress: string,
    options: {
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<UserOverview> {
    await this._checkAddresses([networkAddress, userAddress])
    const [overview, { networkDecimals }] = await Promise.all([
      this.provider.fetchEndpoint<UserOverviewRaw>(
        `networks/${networkAddress}/users/${userAddress}`
      ),
      this.getDecimals(networkAddress, options.decimalsOptions || {})
    ])
    return {
      balance: utils.formatToAmount(overview.balance, networkDecimals),
      frozenBalance: utils.formatToAmount(
        overview.frozenBalance,
        networkDecimals
      ),
      given: utils.formatToAmount(overview.given, networkDecimals),
      leftGiven: utils.formatToAmount(overview.leftGiven, networkDecimals),
      leftReceived: utils.formatToAmount(
        overview.leftReceived,
        networkDecimals
      ),
      received: utils.formatToAmount(overview.received, networkDecimals)
    }
  }

  /**
   * @hidden
   * Returns a mapping from network address to respective decimals.
   * @param networkAddresses List of currency networks.
   */
  public async getDecimalsMap(
    networkAddresses: string[]
  ): Promise<DecimalsMap> {
    const promises = networkAddresses.map(networkAddress =>
      this.getDecimals(networkAddress)
    )
    const decimalsObjects = await Promise.all(promises)
    return networkAddresses.reduce(
      (decimalsMap: DecimalsMap, networkAddress, i) => ({
        ...decimalsMap,
        [networkAddress]: decimalsObjects[i]
      }),
      {}
    )
  }

  /**
   * @hidden
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
    for (const address of addresses) {
      if (!utils.checkAddress(address)) {
        throw new Error(`${address} is not a valid address.`)
      }
    }
    return true
  }

  /**
   * Returns cached decimals of given currency network if existent and fetches if not.
   * Always overwrites cache with manually provided decimals.
   */
  private _getDecimalsCached() {
    const decimalsCache: DecimalsMap = {}
    return async (
      networkAddress: string,
      decimalsOptions: DecimalsOptions = {}
    ) => {
      try {
        await this._checkAddresses([networkAddress])

        if (!decimalsCache[networkAddress]) {
          decimalsCache[networkAddress] = {
            networkDecimals: undefined,
            interestRateDecimals: undefined
          }
        }

        if (typeof decimalsOptions.networkDecimals === 'number') {
          decimalsCache[networkAddress].networkDecimals =
            decimalsOptions.networkDecimals
        }
        if (typeof decimalsOptions.interestRateDecimals === 'number') {
          decimalsCache[networkAddress].interestRateDecimals =
            decimalsOptions.interestRateDecimals
        }

        if (
          typeof decimalsCache[networkAddress].networkDecimals !== 'number' ||
          typeof decimalsCache[networkAddress].interestRateDecimals !== 'number'
        ) {
          const fetchedDecimals = await this.getInfo(networkAddress)

          if (
            typeof decimalsCache[networkAddress].networkDecimals !== 'number'
          ) {
            decimalsCache[networkAddress].networkDecimals =
              fetchedDecimals.decimals
          }

          if (
            typeof decimalsCache[networkAddress].interestRateDecimals !==
            'number'
          ) {
            decimalsCache[networkAddress].interestRateDecimals =
              fetchedDecimals.interestRateDecimals
          }
        }

        return decimalsCache[networkAddress]
      } catch (error) {
        if (error.message.includes('Status 404')) {
          throw new Error(
            `${networkAddress} seems not to be a network address. Decimals have to be explicit.`
          )
        }
        throw error
      }
    }
  }
}
