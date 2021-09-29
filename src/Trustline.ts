import BigNumber from 'bignumber.js'

import { CurrencyNetwork } from './CurrencyNetwork'
import { Event } from './Event'
import { TLProvider } from './providers/TLProvider'
import {
  GAS_LIMIT_IDENTITY_OVERHEAD,
  GAS_LIMIT_MULTIPLIER,
  Transaction
} from './Transaction'
import { User } from './User'

import utils from './utils'

import {
  AnyNetworkTrustlineEvent,
  AnyNetworkTrustlineEventRaw,
  ClosePathObject,
  ClosePathRaw,
  CloseTxObject,
  DecimalsOptions,
  EventFilterOptions,
  FeePayer,
  isFeePayerValue,
  NetworkTrustlineBalanceUpdate,
  NetworkTrustlineCancelEvent,
  NetworkTrustlineUpdateEvent,
  NetworkTrustlineUpdateRequestEvent,
  PaymentOptions,
  RawTxObject,
  TrustlineObject,
  TrustlineRaw,
  TrustlineUpdateOptions,
  TxObject,
  TxOptions
} from './typings'

// Values taken from contracts repository gas tests
// TODO: the gas limit for updating a TL could actually be lower than this depending on the situation.
// TODO: Move the responsibility of filling the default gas limit to wallet since it should know whether to use the
// TODO: identity overhead or not?
const UPDATE_TRUSTLINE_GAS_LIMIT = new BigNumber(361_000)
  .plus(GAS_LIMIT_IDENTITY_OVERHEAD)
  .multipliedBy(GAS_LIMIT_MULTIPLIER)
  .integerValue(BigNumber.ROUND_DOWN)
const CANCEL_TRUSTLINE_GAS_LIMIT = new BigNumber(40_000)
  .plus(GAS_LIMIT_IDENTITY_OVERHEAD)
  .multipliedBy(GAS_LIMIT_MULTIPLIER)
  .integerValue(BigNumber.ROUND_DOWN)
const CLOSE_TRUSTLINE_NO_TRANSFER_GAS_LIMIT = new BigNumber(107_000)
  .plus(GAS_LIMIT_IDENTITY_OVERHEAD)
  .multipliedBy(GAS_LIMIT_MULTIPLIER)
  .integerValue(BigNumber.ROUND_DOWN)
const CLOSE_TRUSTLINE_TRANSFER_GAS_LIMIT_OVERHEAD = new BigNumber(26_000)
  .multipliedBy(GAS_LIMIT_MULTIPLIER)
  .integerValue(BigNumber.ROUND_DOWN)
const CLOSE_TRUSTLINE_TRANSFER_GAS_LIMIT_OVERHEAD_PER_MEDIATOR = new BigNumber(
  34_000
)
  .multipliedBy(GAS_LIMIT_MULTIPLIER)
  .integerValue(BigNumber.ROUND_DOWN)

/**
 * The [[Trustline]] class contains all relevant methods for retrieving, creating and editing trustlines.
 * It is meant to be called via a [[TLNetwork]] instance like:
 * ```typescript
 * const tlNetwork = new TLNetwork(
 *  //...
 * )
 *
 * // Get trustlines
 * tlNetwork.trustline.getAll(
 *  // ...
 * ).then(
 *  trustlines => console.log("Trustlines of loaded user:", trustlines)
 * )
 * ```
 */
export class Trustline {
  private currencyNetwork: CurrencyNetwork
  private event: Event
  private provider: TLProvider
  private transaction: Transaction
  private user: User

  /** @hidden */
  constructor(params: {
    currencyNetwork: CurrencyNetwork
    event: Event
    provider: TLProvider
    transaction: Transaction
    user: User
  }) {
    this.event = params.event
    this.user = params.user
    this.transaction = params.transaction
    this.currencyNetwork = params.currencyNetwork
    this.provider = params.provider
  }

  /**
   * Prepares a transaction object for creating a trustline update request.
   * Called by initiator of update request.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty who receives trustline update request.
   * @param creditlineGiven Proposed creditline limit given by initiator to counterparty,
   *                        e.g. 1.23 if network has 2 decimals.
   * @param creditlineReceived Proposed creditline limit received by initiator from counterparty,
   *                           e.g. 1.23 if network has 2 decimals.
   * @param options Options for creating an `updateTrustline` ethereum transaction.
   *                See type [[TrustlineUpdateOptions]] for more information.
   * @param options.interestRateGiven Proposed interest rate given by initiator to counterparty in % per year.
   * @param options.interestRateReceived Proposed interest rate received by initiator from counterparty in % per year.
   * @param options.isFrozen Whether we propose to freeze the trustline.
   * @param options.transfer To propose a transfer to be effective upon acceptation of the trustline
   *                          e.g. 1.23 if network has 2 decimals.
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
    if (
      options.interestRateGiven !== undefined &&
      options.interestRateReceived !== undefined &&
      options.isFrozen === undefined
    ) {
      options.isFrozen = false
    }

    const {
      interestRateGiven,
      interestRateReceived,
      networkDecimals,
      interestRateDecimals,
      gasLimit,
      gasPrice,
      isFrozen,
      transfer
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
    let updateFuncArgs: any[] = [
      counterpartyAddress,
      utils.convertToHexString(
        utils.calcRaw(creditlineGiven, decimals.networkDecimals)
      ),
      utils.convertToHexString(
        utils.calcRaw(creditlineReceived, decimals.networkDecimals)
      )
    ]

    // If interest rates were specified, use `updateTrustline`
    if (
      interestRateGiven !== undefined &&
      interestRateReceived !== undefined &&
      isFrozen !== undefined
    ) {
      updateFuncName = 'updateTrustline(address,uint64,uint64,int16,int16,bool)'
      updateFuncArgs = [
        ...updateFuncArgs,
        utils.convertToHexString(
          customInterests
            ? utils.calcRaw(interestRateGiven, decimals.interestRateDecimals)
            : defaultInterestRate.raw
        ),
        utils.convertToHexString(
          customInterests
            ? utils.calcRaw(interestRateReceived, decimals.interestRateDecimals)
            : defaultInterestRate.raw
        ),
        isFrozen
      ]

      if (typeof transfer === 'string' && isNaN(parseFloat(transfer))) {
        throw new Error('Transfer is not a number')
      }

      if (
        transfer !== undefined &&
        ((typeof transfer === 'string' && parseFloat(transfer) !== 0) ||
          (typeof transfer === 'number' && transfer !== 0))
      ) {
        updateFuncName =
          'updateTrustline(address,uint64,uint64,int16,int16,bool,int72)'
        updateFuncArgs = [
          ...updateFuncArgs,
          utils.convertToHexString(
            utils.calcRaw(transfer, decimals.networkDecimals)
          )
        ]
      }
    } else if (
      interestRateGiven !== undefined ||
      interestRateReceived !== undefined ||
      isFrozen !== undefined ||
      transfer !== undefined
    ) {
      throw new Error(
        'Invalid input parameters: if any of interestRateGiven, or interestRateReceived is given, both have to be given. If isFrozen or transfer is given, both interest rates have to be given.'
      )
    }

    const { rawTx, txFees } = await this.transaction.prepareContractTransaction(
      await this.user.getAddress(),
      networkAddress,
      'CurrencyNetworkV2',
      updateFuncName,
      updateFuncArgs,
      {
        gasLimit: gasLimit
          ? new BigNumber(gasLimit)
          : UPDATE_TRUSTLINE_GAS_LIMIT,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      txFees,
      rawTx
    }
  }

  /**
   * Prepares a transaction object for accepting a trustline update request. Called
   * by receiver of initial update request.
   * @param networkAddress Address of a currency network.
   * @param initiatorAddress Address of user who initiated the trustline update request.
   * @param creditlineGiven Proposed creditline limit given by receiver to initiator,
   *                        i.e. 1.23 if network has to 2 decimals.
   * @param creditlineReceived Proposed creditline limit received by initiator from receiver,
   *                           i.e. 1.23 if network has to 2 decimals.
   * @param options Options for creating a ethereum transaction. See type [[TrustlineUpdateOptions]] for more information.
   * @param options.interestRateGiven Proposed interest rate given by receiver to initiator in % per year.
   * @param options.interestRateReceived Proposed interest rate received by initiator from receiver in % per year.
   * @param options.isFrozen Whether we propose to freeze the trustline.
   * @param options.transfer To propose a transfer to be effective upon acceptation of the trustline
   *                          e.g. 1.23 if network has 2 decimals.
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
   * Prepares a transaction object for canceling / rejecting a trustline update request.
   * Called by initiator of cancel.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty to cancel / reject the trustline update with.
   * @param options Options for creating the ethereum transaction.
   *                See [[TxOptions]] for more information.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   */
  public async prepareCancelTrustlineUpdate(
    networkAddress: string,
    counterpartyAddress: string,
    options: TxOptions = {}
  ): Promise<TxObject> {
    const { gasLimit, gasPrice } = options

    const cancelFuncName = 'cancelTrustlineUpdate'
    const cancelFuncArgs: any[] = [counterpartyAddress]

    const { rawTx, txFees } = await this.transaction.prepareContractTransaction(
      await this.user.getAddress(),
      networkAddress,
      'CurrencyNetworkV2',
      cancelFuncName,
      cancelFuncArgs,
      {
        gasLimit: gasLimit
          ? new BigNumber(gasLimit)
          : CANCEL_TRUSTLINE_GAS_LIMIT,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      txFees,
      rawTx
    }
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
   * Returns all trustlines of a loaded user in all currency networks.
   */
  public async getAllOfUser(): Promise<TrustlineObject[]> {
    const endpoint = `users/${await this.user.getAddress()}/trustlines`
    const trustlines = await this.provider.fetchEndpoint<TrustlineRaw[]>(
      endpoint
    )
    const networkAddressesOfTrustlines = new Set(
      trustlines.map(trustline => trustline.currencyNetwork)
    )
    const decimalsMap = await this.currencyNetwork.getDecimalsMap(
      Array.from(networkAddressesOfTrustlines)
    )
    return trustlines.map(trustline =>
      this._formatTrustline(
        trustline,
        decimalsMap[trustline.currencyNetwork].networkDecimals,
        decimalsMap[trustline.currencyNetwork].interestRateDecimals
      )
    )
  }

  /**
   * Returns all trustlines of a loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   * @param options Extra options for user, network or trustline.
   */
  public async getAll(
    networkAddress: string,
    options: {
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<TrustlineObject[]> {
    const endpoint = `networks/${networkAddress}/users/${await this.user.getAddress()}/trustlines`
    const [
      trustlines,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.provider.fetchEndpoint<TrustlineRaw[]>(endpoint),
      this.currencyNetwork.getDecimals(
        networkAddress,
        options.decimalsOptions || {}
      )
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
    counterpartyAddress: string,
    options: {
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<TrustlineObject> {
    const endpoint = `networks/${networkAddress}/users/${await this.user.getAddress()}/trustlines/${counterpartyAddress}`
    const [
      trustline,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.provider.fetchEndpoint<TrustlineRaw>(endpoint),
      this.currencyNetwork.getDecimals(
        networkAddress,
        options.decimalsOptions || {}
      )
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
  ): Promise<NetworkTrustlineUpdateRequestEvent[]> {
    return this.event.get<NetworkTrustlineUpdateRequestEvent>(networkAddress, {
      ...filter,
      type: 'TrustlineUpdateRequest'
    })
  }

  /**
   * Returns trustline update cancels of loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public getTrustlineUpdateCancels(
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTrustlineCancelEvent[]> {
    return this.event.get<NetworkTrustlineCancelEvent>(networkAddress, {
      ...filter,
      type: 'TrustlineUpdateCancel'
    })
  }

  /**
   * Returns trustline updates of loaded user in a currency network. An update
   * happens when a user accepts a trustline update request.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public getUpdates(
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTrustlineUpdateEvent[]> {
    return this.event.get<NetworkTrustlineUpdateEvent>(networkAddress, {
      ...filter,
      type: 'TrustlineUpdate'
    })
  }

  /**
   * Returns trustline balance updates of a specific trustline in a currency network. A balance update
   * happens, because of interests or because of received, sent or mediated transfers.
   * @param networkAddress Address of a currency network.
   * @param counterPartyAddress Address of the counter party of the trustline.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public getTrustlineBalanceUpdates(
    networkAddress: string,
    counterPartyAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTrustlineBalanceUpdate[]> {
    return this.getEvents(networkAddress, counterPartyAddress, {
      ...filter,
      type: 'BalanceUpdate'
    }) as Promise<NetworkTrustlineBalanceUpdate[]>
  }

  /**
   * Returns all events of a specific trustline in a currency network. These are BalanceUpdate, TrustlineUpdate,
   * TrustlineUpdateRequest and TrustlineUpdateCancel
   * @param networkAddress Address of a currency network.
   * @param counterPartyAddress Address of the counter party of the trustline.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public async getEvents(
    networkAddress: string,
    counterPartyAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<AnyNetworkTrustlineEvent[]> {
    const endpoint = `networks/${networkAddress}/users/${await this.user.getAddress()}/trustlines/${counterPartyAddress}/events`
    const parameterUrl = utils.buildUrl(endpoint, { query: filter })
    const [
      events,
      { networkDecimals, interestRateDecimals }
    ] = await Promise.all([
      this.provider.fetchEndpoint<AnyNetworkTrustlineEventRaw[]>(parameterUrl),
      this.currencyNetwork.getDecimals(networkAddress)
    ])

    return events.map(event =>
      utils.formatEvent<AnyNetworkTrustlineEvent>(
        event,
        networkDecimals,
        interestRateDecimals
      )
    )
  }

  /**
   * Prepares an ethereum transaction object for closing a trustline.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty to who the trustline should be settled.
   * @param options Payment options. See [[PaymentOptions]] for more information.
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
    const { path, maxFees, value } = await this.getClosePath(
      networkAddress,
      await this.user.getAddress(),
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
        utils.convertToHexString(new BigNumber(maxFees.raw)),
        path
      ]
    }

    // Prepare the interaction with the contract.
    const { rawTx, txFees } = await this.transaction.prepareContractTransaction(
      await this.user.getAddress(),
      networkAddress,
      'CurrencyNetworkV2',
      closeFuncName,
      closeFuncArgs,
      {
        gasLimit: gasLimit
          ? new BigNumber(gasLimit)
          : this.calculateCloseTrustlineGasLimit(path.length),
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )

    return {
      txFees,
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
   * @param options Payment options. See [[PaymentOptions]] for more information.
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
    const { path, fees, value, feePayer } = await this.provider.postToEndpoint<
      ClosePathRaw
    >(endpoint, data)

    if (!isFeePayerValue(feePayer)) {
      throw Error(`Unexpected feePayer value: ${feePayer}`)
    }

    return {
      feePayer: feePayer as FeePayer,
      maxFees: utils.formatToAmount(fees, decimals.networkDecimals),
      path,
      value: utils.formatToAmount(value, decimals.networkDecimals)
    }
  }

  /**
   * Builds an invite link for a trustline request in the format
   * ```
   * <BASE_URL>/trustlinerequest/:networkAddress/:senderAddress/:creditlineGiven/:creditlineReceived/:interestRateGiven/:interestRateReceived[?:optionalParams]
   * ```
   * @param networkAddress Address of currency network.
   * @param amounts Amounts to use for the trustline request.
   * @param amounts.creditlineGiven Credit limit set for receiver. Denominated in "normal" units.
   * @param amounts.creditlineReceived Credit limit set for sender. Denominated in "normal" units.
   * @param amounts.interestRateGiven Optional interest rate for receiver if allowed in currency network. Denominated in % per year.
   * @param amounts.interestRateReceived Optional interest rate for sender if allowed in currency network. Denominated in % per year.
   * @param options Additional options for link creation.
   * @param options.customBase Optional custom base for link.
   * @param options[key] Any other additional query param that should added to the trustline request link like `<TRUSTLINE_REQUEST_LINK>?key=value`.
   */
  public async buildTrustlineRequestInviteLink(
    networkAddress: string,
    amounts: {
      creditlineGiven: string | number
      creditlineReceived: string | number
      interestRateGiven?: string | number
      interestRateReceived?: string | number
    },
    options?: {
      [key: string]: string
      customBase?: string
    }
  ): Promise<string> {
    const {
      creditlineGiven,
      creditlineReceived,
      interestRateGiven = '0',
      interestRateReceived = '0'
    } = amounts
    const { customBase, ...rest } = options || {}
    const path = [
      'trustlinerequest',
      networkAddress,
      await this.user.getAddress(),
      String(creditlineGiven),
      String(creditlineReceived),
      String(interestRateGiven),
      String(interestRateReceived)
    ]

    return utils.buildUrl(customBase, { path, query: rest })
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
      balance: utils.formatToAmount(trustline.balance, networkDecimals),
      given: utils.formatToAmount(trustline.given, networkDecimals),
      interestRateGiven: utils.formatToAmount(
        trustline.interestRateGiven,
        interestDecimals
      ),
      interestRateReceived: utils.formatToAmount(
        trustline.interestRateReceived,
        interestDecimals
      ),
      leftGiven: utils.formatToAmount(trustline.leftGiven, networkDecimals),
      leftReceived: utils.formatToAmount(
        trustline.leftReceived,
        networkDecimals
      ),
      received: utils.formatToAmount(trustline.received, networkDecimals)
    }
  }

  private calculateCloseTrustlineGasLimit(pathLength: number): BigNumber {
    if (pathLength === 0) {
      return CLOSE_TRUSTLINE_NO_TRANSFER_GAS_LIMIT
    }

    const mediators = pathLength - 2
    return CLOSE_TRUSTLINE_NO_TRANSFER_GAS_LIMIT.plus(
      CLOSE_TRUSTLINE_TRANSFER_GAS_LIMIT_OVERHEAD_PER_MEDIATOR.multipliedBy(
        mediators
      )
    ).plus(CLOSE_TRUSTLINE_TRANSFER_GAS_LIMIT_OVERHEAD)
  }
}
