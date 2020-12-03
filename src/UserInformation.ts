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
  TransferredSumObject,
  TransferredSumRaw,
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

  /**
   * Get all the mediation fees the loaded user has earned
   * @param networkAddress the address of the network for which to get the fees
   * @param options
   * @param options.timeWindowOption the time window to filter the fees. Has startTime and endTime
   * @param options.decimalsOptions the decimal options of the currency network to format fee values
   */
  public async getEarnedMediationFees(
    networkAddress: string,
    options: {
      timeWindowOption?: { startTime: number; endTime: number }
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<EarnedMediationFeesListObject> {
    const userAddress = await this.user.getAddress()
    const baseUrl = `networks/${networkAddress}/users/${userAddress}/mediation-fees`
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

  /**
   * Get all the accrued interests the loaded user has earned and paid out
   * The returned values are positive for earned interests and negative for paid out interests
   * @param networkAddress the address of the network
   * @param options
   * @param options.timeWindowOption the time window to filter the fees. Has startTime and endTime
   * @param options.decimalsOptions the decimal options of the currency network to format fee values
   */
  public async getAccruedInterests(
    networkAddress: string,
    options: {
      timeWindowOption?: { startTime: number; endTime: number }
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<UserAccruedInterestsObject> {
    const userAddress = await this.user.getAddress()
    const baseUrl = `networks/${networkAddress}/users/${userAddress}/interests`
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

  /**
   * Get all the accrued interests the loaded user has earned and paid out on a single trustline
   * The returned values are positive for earned interests and negative for paid out interests
   * @param networkAddress the address of the network
   * @param counterpartyAddress the address of the counterparty of the trustlines
   * @param options
   * @param options.timeWindowOption the time window to filter the fees. Has startTime and endTime
   * @param options.decimalsOptions the decimal options of the currency network to format fee values
   */
  public async getAccruedInterestsOnTrustline(
    networkAddress: string,
    counterpartyAddress: string,
    options: {
      timeWindowOption?: { startTime: number; endTime: number }
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<TrustlineAccruedInterestsObject> {
    const userAddress = await this.user.getAddress()
    const baseUrl = `networks/${networkAddress}/users/${userAddress}/interests/${counterpartyAddress}`
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

  /**
   * Get the sum of all transfer made in time window and network from sender to receiver
   * Does take into account transfer from receiver to sender, or any other transfer
   * The value returned can only be positive
   * @param networkAddress the address of the network
   * @param senderAddress the address of the sender of transfers
   * @param receiverAddress the address of the receiver of transfers
   * @param options
   * @param options.timeWindowOption the time window to filter the fees. Has startTime and endTime
   * @param options.decimalsOptions the decimal options of the currency network to format fee values
   */
  public async getTotalTransferredSum(
    networkAddress: string,
    senderAddress: string,
    receiverAddress: string,
    options: {
      timeWindowOption?: { startTime: number; endTime: number }
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<TransferredSumObject> {
    const baseUrl = `networks/${networkAddress}/users/${senderAddress}/transferredSums/${receiverAddress}`
    const parameterUrl = utils.buildUrl(
      baseUrl,
      options.timeWindowOption && { query: options.timeWindowOption }
    )

    const [
      transferredSumRaw,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.provider.fetchEndpoint<TransferredSumRaw>(parameterUrl),
      this.currencyNetwork.getDecimals(
        networkAddress,
        options.decimalsOptions || {}
      )
    ])

    return {
      value: utils.formatToAmount(transferredSumRaw.value, networkDecimals),
      sender: transferredSumRaw.sender,
      receiver: transferredSumRaw.receiver,
      startTime: transferredSumRaw.startTime,
      endTime: transferredSumRaw.endTime
    }
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
