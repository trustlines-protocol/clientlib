import { TLProvider } from './providers/TLProvider'
import { User } from './User'

import utils from './utils'

import {
  AccruedInterestsObject,
  AccruedInterestsRaw,
  DecimalsOptions,
  TransferInformation,
  TransferInformationRaw,
  TrustlineAccruedInterestsObject,
  TrustlineAccruedInterestsRaw,
  UserAccruedInterestsObject,
  UserAccruedInterestsRaw
} from './typings'

import { CurrencyNetwork } from './CurrencyNetwork'

/**
 * The Information class contains all methods related to retrieving processed infos about a user's trustlines.
 */
export class Information {
  private provider: TLProvider
  private user: User
  private currencyNetwork: CurrencyNetwork

  constructor(params: {
    user: User
    provider: TLProvider
    currencyNetwork: CurrencyNetwork
  }) {
    this.user = params.user
    this.provider = params.provider
    this.currencyNetwork = params.currencyNetwork
  }

  public async getUserAccruedInterests(
    networkAddress: string,
    options: {
      timeWindowOption?: { startTime: number; endTime: number }
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<UserAccruedInterestsObject> {
    const baseUrl = `networks/${networkAddress}/users/${await this.user.getAddress()}/interests`
    const parameterUrl = utils.buildUrl(baseUrl, options.timeWindowOption || {})

    const [
      userAccruedInterests,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.provider.fetchEndpoint<UserAccruedInterestsRaw>(parameterUrl),
      this.currencyNetwork.getDecimals(
        networkAddress,
        options.decimalsOptions || {}
      )
    ])

    return userAccruedInterests.map(trustlineAccruedInterestsRaw =>
      this.formatTrustlineAccruedInterestsRaw(
        trustlineAccruedInterestsRaw,
        networkDecimals,
        interestRateDecimals
      )
    )
  }

  public async getTrustlineAccruedInterests(
    networkAddress: string,
    counterpartyAddress: string,
    options: {
      timeWindowOption?: { startTime: number; endTime: number }
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<TrustlineAccruedInterestsObject> {
    const baseUrl = `networks/${networkAddress}/users/${await this.user.getAddress()}/interests/${counterpartyAddress}`
    const parameterUrl = utils.buildUrl(baseUrl, options.timeWindowOption || {})

    const [
      trustlineAccruedInterestsRaw,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.provider.fetchEndpoint<TrustlineAccruedInterestsRaw>(parameterUrl),
      this.currencyNetwork.getDecimals(
        networkAddress,
        options.decimalsOptions || {}
      )
    ])

    return this.formatTrustlineAccruedInterestsRaw(
      trustlineAccruedInterestsRaw,
      networkDecimals,
      interestRateDecimals
    )
  }

  public async getTransferInformation(
    txHash: string,
    options: {
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<TransferInformation> {
    const baseUrl = `/transfers/${txHash}`

    const transferInformation = await this.provider.fetchEndpoint<
      TransferInformationRaw
    >(baseUrl)
    const { networkDecimals } = await this.currencyNetwork.getDecimals(
      transferInformation.currencyNetwork,
      options.decimalsOptions || {}
    )

    return this.formatTransferInformationRaw(
      transferInformation,
      networkDecimals
    )
  }

  private formatTrustlineAccruedInterestsRaw(
    trustlineAccruedInterestsRaw: TrustlineAccruedInterestsRaw,
    networkDecimals: number,
    interestRateDecimals: number
  ): TrustlineAccruedInterestsObject {
    return {
      accruedInterests: trustlineAccruedInterestsRaw.accruedInterests.map(
        accruedInterests =>
          this.formatAccruedInterestsRaw(
            accruedInterests,
            networkDecimals,
            interestRateDecimals
          )
      ),
      user: trustlineAccruedInterestsRaw.user,
      counterparty: trustlineAccruedInterestsRaw.counterparty
    }
  }

  private formatAccruedInterestsRaw(
    accruedInterests: AccruedInterestsRaw,
    networkDecimals: number,
    interestRateDecimals: number
  ): AccruedInterestsObject {
    return {
      value: utils.formatToAmount(accruedInterests.value, networkDecimals),
      interestRate: utils.formatToAmount(
        accruedInterests.interestRate,
        interestRateDecimals
      ),
      timestamp: accruedInterests.timestamp
    }
  }

  private formatTransferInformationRaw(
    transferInformation: TransferInformationRaw,
    networkDecimals: number
  ): TransferInformation {
    return {
      path: transferInformation.path,
      currencyNetwork: transferInformation.currencyNetwork,
      value: utils.formatToAmount(transferInformation.value, networkDecimals),
      feePayer: utils.formatToFeePayer(transferInformation.feePayer),
      totalFees: utils.formatToAmount(
        transferInformation.totalFees,
        networkDecimals
      ),
      feesPaid: transferInformation.feesPaid.map(feesPaidRaw =>
        utils.formatToAmount(feesPaidRaw, networkDecimals)
      )
    }
  }
}
