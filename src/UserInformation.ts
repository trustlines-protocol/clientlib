import { TLProvider } from './providers/TLProvider'
import { User } from './User'

import utils from './utils'

import {
  AccruedInterestsObject,
  AccruedInterestsRaw,
  DecimalsOptions,
  EarnedMediationFeesListObject,
  EarnedMediationFeesListRaw,
  MediationFeeObject,
  MediationFeeRaw,
  TrustlineAccruedInterestsObject,
  TrustlineAccruedInterestsRaw,
  UserAccruedInterestsObject,
  UserAccruedInterestsRaw
} from './typings'

import { CurrencyNetwork } from './CurrencyNetwork'

/**
 * The UserInformation class contains methods related to getting trustlines related information of a user.
 */
export class UserInformation {
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

  public async getUserEarnedMediationFees(
    networkAddress: string,
    options: {
      timeWindowOption?: { startTime: number; endTime: number }
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<EarnedMediationFeesListObject> {
    const baseUrl = `networks/${networkAddress}/users/${await this.user.getAddress()}/mediation-fees`
    const parameterUrl = utils.buildUrl(
      baseUrl,
      options.timeWindowOption && { query: options.timeWindowOption }
    )

    const [
      earnedMediationFeesList,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.provider.fetchEndpoint<EarnedMediationFeesListRaw>(parameterUrl),
      this.currencyNetwork.getDecimals(
        networkAddress,
        options.decimalsOptions || {}
      )
    ])

    return {
      user: earnedMediationFeesList.user,
      network: earnedMediationFeesList.network,
      mediationFees: earnedMediationFeesList.mediationFees.map(mediationFee =>
        this.formatMediationFeeRaw(mediationFee, networkDecimals)
      )
    }
  }

  public async getUserAccruedInterests(
    networkAddress: string,
    options: {
      timeWindowOption?: { startTime: number; endTime: number }
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<UserAccruedInterestsObject> {
    const baseUrl = `networks/${networkAddress}/users/${await this.user.getAddress()}/interests`
    const parameterUrl = utils.buildUrl(
      baseUrl,
      options.timeWindowOption && { query: options.timeWindowOption }
    )

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
    const parameterUrl = utils.buildUrl(
      baseUrl,
      options.timeWindowOption && { query: options.timeWindowOption }
    )

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

  private formatMediationFeeRaw(
    mediationFeeRaw: MediationFeeRaw,
    networkDecimals: number
  ): MediationFeeObject {
    return {
      value: utils.formatToAmount(mediationFeeRaw.value, networkDecimals),
      from: mediationFeeRaw.from,
      to: mediationFeeRaw.to,
      transactionHash: mediationFeeRaw.transactionHash,
      timestamp: mediationFeeRaw.timestamp
    }
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
}
