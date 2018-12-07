import BigNumber from 'bignumber.js'

import { CurrencyNetwork } from './CurrencyNetwork'
import { Event } from './Event'
import { Transaction } from './Transaction'
import { User } from './User'
import { Utils } from './Utils'

import {
  ClosePathObject,
  ClosePathRaw,
  CloseTxObject,
  EventFilterOptions,
  NetworkTrustlineEvent,
  PaymentOptions,
  RawTxObject,
  TrustlineObject,
  TrustlineRaw,
  TrustlineUpdateOptions,
  TxObject
} from './typings'

/**
 * The Trustline class contains all relevant methods for retrieving, creating and
 * editing trustlines.
 */
export class Trustline {
  private event: Event
  private user: User
  private utils: Utils
  private transaction: Transaction
  private currencyNetwork: CurrencyNetwork

  constructor(
    event: Event,
    user: User,
    utils: Utils,
    transaction: Transaction,
    currencyNetwork: CurrencyNetwork
  ) {
    this.event = event
    this.user = user
    this.utils = utils
    this.transaction = transaction
    this.currencyNetwork = currencyNetwork
  }

  /**
   * Prepares an ethereum transaction object for creating a trustline update request.
   * Called by initiator of update request.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty who receives trustline update request.
   * @param creditlineGiven Proposed creditline limit given by initiator to counterparty,
   *                        i.e. 1.23 if network has to 2 decimals.
   * @param creditlineReceived Proposed creditline limit received by initiator from counterparty,
   *                           i.e. 1.23 if network has to 2 decimals.
   * @param options Options for creating an `updateTrustline` ethereum transaction.
   *                See type `TrustlineUpdateOptions` for more information.
   * @param options.interestRateGiven Proposed interest rate given by initiator to counterparty in % per year.
   * @param options.interestRateReceived Proposed interest rate received by initiator from counterparty in % per year.
   * @param options.networkDecimals Decimals of currency network can be provided manually if known.
   * @param options.interestRateDecimals Decimals of interest rate in currency network can be provided manually if known.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   */
  public async prepareUpdate(
    networkAddress: string,
    counterpartyAddress: string,
    creditlineGiven: number | string,
    creditlineReceived: number | string,
    options: TrustlineUpdateOptions = {}
  ): Promise<TxObject> {
    const {
      interestRateGiven,
      interestRateReceived,
      networkDecimals,
      interestRateDecimals,
      gasLimit,
      gasPrice
    } = options
    const [
      decimals,
      { customInterests, defaultInterestRate }
    ] = await Promise.all([
      this.currencyNetwork.getDecimals(networkAddress, {
        interestRateDecimals,
        networkDecimals
      }),
      this.currencyNetwork.getInfo(networkAddress)
    ])

    // Contract function name and args to use, which can either be
    // `updateTrustline` or `updateCreditlimits`.
    let updateFuncName = 'updateCreditlimits'
    let updateFuncArgs = [
      counterpartyAddress,
      this.utils.convertToHexString(
        this.utils.calcRaw(creditlineGiven, decimals.networkDecimals)
      ),
      this.utils.convertToHexString(
        this.utils.calcRaw(creditlineReceived, decimals.networkDecimals)
      )
    ]

    // If interest rates were specified, use `updateTrustline`
    if (interestRateGiven && interestRateReceived) {
      updateFuncName = 'updateTrustline'
      updateFuncArgs = [
        ...updateFuncArgs,
        this.utils.convertToHexString(
          customInterests
            ? this.utils.calcRaw(
                interestRateGiven,
                decimals.interestRateDecimals
              )
            : defaultInterestRate.raw
        ),
        this.utils.convertToHexString(
          customInterests
            ? this.utils.calcRaw(
                interestRateReceived,
                decimals.interestRateDecimals
              )
            : defaultInterestRate.raw
        )
      ]
    }

    const { rawTx, ethFees } = await this.transaction.prepFuncTx(
      this.user.address,
      networkAddress,
      'CurrencyNetwork',
      updateFuncName,
      updateFuncArgs,
      {
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      ethFees: this.utils.convertToAmount(ethFees),
      rawTx
    }
  }

  /**
   * Prepares an ethereum transaction object for accepting a trustline update request. Called
   * by receiver of initial update request.
   * @param networkAddress Address of a currency network.
   * @param initiatorAddress Address of user who initiated the trustline update request.
   * @param creditlineGiven Proposed creditline limit given by receiver to initiator,
   *                        i.e. 1.23 if network has to 2 decimals.
   * @param creditlineReceived Proposed creditline limit received by initiator from receiver,
   *                           i.e. 1.23 if network has to 2 decimals.
   * @param options Options for creating a ethereum transaction. See type `TLOptions` for more information.
   * @param options.interestRateGiven Proposed interest rate given by receiver to initiator in % per year.
   * @param options.interestRateReceived Proposed interest rate received by initiator from receiver in % per year.
   * @param options.interestRateDecimals Decimals of interest rate in currency network can be provided manually if known.
   * @param options.decimals Decimals of currency network can be provided manually if known.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   */
  public prepareAccept(
    networkAddress: string,
    initiatorAddress: string,
    creditlineGiven: number | string,
    creditlineReceived: number | string,
    options: TrustlineUpdateOptions = {}
  ): Promise<TxObject> {
    return this.prepareUpdate(
      networkAddress,
      initiatorAddress,
      creditlineGiven,
      creditlineReceived,
      options
    )
  }

  /**
   * Signs a raw transaction object as returned by `prepareAccept` or `prepareUpdate`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<any> {
    return this.transaction.confirm(rawTx)
  }

  /**
   * Returns all trustlines of a loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   */
  public async getAll(networkAddress: string): Promise<TrustlineObject[]> {
    const endpoint = `networks/${networkAddress}/users/${
      this.user.address
    }/trustlines`
    const [
      trustlines,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.utils.fetchUrl<TrustlineRaw[]>(endpoint),
      this.currencyNetwork.getDecimals(networkAddress)
    ])
    return trustlines.map(trustline =>
      this._formatTrustline(trustline, networkDecimals, interestRateDecimals)
    )
  }

  /**
   * Returns a trustline to a counterparty address in a specified currency network.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty of trustline.
   */
  public async get(
    networkAddress: string,
    counterpartyAddress: string
  ): Promise<TrustlineObject> {
    const endpoint = `networks/${networkAddress}/users/${
      this.user.address
    }/trustlines/${counterpartyAddress}`
    const [
      trustline,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.utils.fetchUrl<TrustlineRaw>(endpoint),
      this.currencyNetwork.getDecimals(networkAddress)
    ])
    return this._formatTrustline(
      trustline,
      networkDecimals,
      interestRateDecimals
    )
  }

  /**
   * Returns trustline update requests of loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public getRequests(
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTrustlineEvent[]> {
    return this.event.get<NetworkTrustlineEvent>(networkAddress, {
      ...filter,
      type: 'TrustlineUpdateRequest'
    })
  }

  /**
   * Returns trustline updates of loaded user in a currency network. A update
   * happens when a user accepts a trustline update request.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public getUpdates(
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTrustlineEvent[]> {
    return this.event.get<NetworkTrustlineEvent>(networkAddress, {
      ...filter,
      type: 'TrustlineUpdate'
    })
  }

  /**
   * Prepares an ethereum transaction object for closing a trustline.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty to who the trustline should be settled.
   * @param options Payment options. See `PaymentOptions` for more information.
   * @param options.decimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user if willing to pay.
   * @returns A transaction object for closing a trustline. See `CloseTxObject` for more information.
   */
  public async prepareClose(
    networkAddress: string,
    counterpartyAddress: string,
    options: PaymentOptions = {}
  ): Promise<CloseTxObject> {
    // Get the users options and make sure to have a decimals.
    const { gasPrice, gasLimit, networkDecimals } = options
    const decimals = await this.currencyNetwork.getDecimals(networkAddress, {
      networkDecimals
    })

    // Get close path
    const { path, maxFees, estimatedGas, value } = await this.getClosePath(
      networkAddress,
      this.user.address,
      counterpartyAddress,
      {
        ...options,
        networkDecimals: decimals.networkDecimals
      }
    )

    // Determine which close function to call with which arguments.
    let closeFuncName
    let closeFuncArgs

    // If estimated value to be transferred for closing the trustline is
    // ZERO, a triangulated transfer is NOT needed.
    if (value.raw === '0') {
      closeFuncName = 'closeTrustline'
      closeFuncArgs = [counterpartyAddress]
    } else {
      // If there is no path with enough capacity for triangulation throw.
      if (path.length === 0) {
        throw new Error('Could not find a path with enough capacity.')
      }
      closeFuncName = 'closeTrustlineByTriangularTransfer'
      closeFuncArgs = [
        counterpartyAddress,
        this.utils.convertToHexString(new BigNumber(maxFees.raw)),
        path.slice(1)
      ]
    }

    // Prepare the interaction with the contract.
    const { rawTx, ethFees } = await this.transaction.prepFuncTx(
      this.user.address,
      networkAddress,
      'CurrencyNetwork',
      closeFuncName,
      closeFuncArgs,
      {
        gasLimit: gasLimit
          ? new BigNumber(gasLimit)
          : new BigNumber(estimatedGas).multipliedBy(1.5).integerValue(),
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )

    return {
      ethFees: this.utils.convertToAmount(ethFees),
      maxFees,
      path,
      rawTx
    }
  }

  /**
   * Returns a path for closing a trustline between sender and counterparty.
   * @param networkAddress Address of a currency network.
   * @param senderAddress Address of sender.
   * @param counterpartyAddress Address of counterparty of trustline.
   * @param options Payment options. See `PaymentOptions` for more information.
   * @param options.networkDecimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user if willing to pay.
   * @returns Relevant information for closing a trustline. See `ClosePathObject`.
   */
  public async getClosePath(
    networkAddress: string,
    senderAddress: string,
    counterpartyAddress: string,
    options: PaymentOptions = {}
  ): Promise<ClosePathObject> {
    // Get the users options and make sure to have a decimal.
    const { networkDecimals, maximumHops, maximumFees } = options
    const decimals = await this.currencyNetwork.getDecimals(networkAddress, {
      networkDecimals
    })

    // Define the relay endpoint.
    const endpoint = `networks/${networkAddress}/close-trustline-path-info`

    // Define properties for the relay request.
    const data = {
      from: senderAddress,
      maxFees: maximumFees,
      maxHops: maximumHops,
      to: counterpartyAddress
    }

    // Request the relay for a path to settle down the trustline.
    const { path, estimatedGas, fees, value } = await this.utils.fetchUrl<
      ClosePathRaw
    >(endpoint, {
      body: JSON.stringify(data),
      headers: new Headers({ 'Content-Type': 'application/json' }),
      method: 'post'
    })

    return {
      estimatedGas: new BigNumber(estimatedGas),
      maxFees: this.utils.formatToAmount(fees, decimals.networkDecimals),
      path,
      value: this.utils.formatToAmount(value, decimals.networkDecimals)
    }
  }

  /**
   * Formats number values of trustline retrieved from the relay server.
   * @param trustline unformatted trustline
   * @param decimals decimals object of currency network
   */
  private _formatTrustline(
    trustline: TrustlineRaw,
    networkDecimals: number,
    interestDecimals: number
  ): TrustlineObject {
    return {
      ...trustline,
      balance: this.utils.formatToAmount(trustline.balance, networkDecimals),
      given: this.utils.formatToAmount(trustline.given, networkDecimals),
      interestRateGiven: this.utils.formatToAmount(
        trustline.interestRateGiven,
        interestDecimals
      ),
      interestRateReceived: this.utils.formatToAmount(
        trustline.interestRateReceived,
        interestDecimals
      ),
      leftGiven: this.utils.formatToAmount(
        trustline.leftGiven,
        networkDecimals
      ),
      leftReceived: this.utils.formatToAmount(
        trustline.leftReceived,
        networkDecimals
      ),
      received: this.utils.formatToAmount(trustline.received, networkDecimals)
    }
  }
}
