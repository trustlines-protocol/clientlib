import BigNumber from 'bignumber.js'

import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import {
  PaymentOptions,
  EventFilterOptions,
  TxObject,
  CloseTxObject,
  ClosePathRaw,
  ClosePathObject,
  TrustlineObject,
  TrustlineRaw,
  NetworkTrustlineEvent,
  RawTxObject,
  TrustlineUpdateOptions
} from './typings'

/**
 * The Trustline class contains all relevant methods for retrieving, creating and
 * editing trustlines.
 */
export class Trustline {
  private _event: Event
  private _user: User
  private _utils: Utils
  private _transaction: Transaction
  private _currencyNetwork: CurrencyNetwork

  constructor (
    event: Event,
    user: User,
    utils: Utils,
    transaction: Transaction,
    currencyNetwork: CurrencyNetwork
  ) {
    this._event = event
    this._user = user
    this._utils = utils
    this._transaction = transaction
    this._currencyNetwork = currencyNetwork
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
  public async prepareUpdate (
    networkAddress: string,
    counterpartyAddress: string,
    creditlineGiven: number | string,
    creditlineReceived: number | string,
    options: TrustlineUpdateOptions = {}
  ): Promise<TxObject> {
    const { _currencyNetwork, _transaction, _user, _utils } = this
    const {
      interestRateGiven = 0,
      interestRateReceived = 0,
      networkDecimals,
      interestRateDecimals,
      gasLimit,
      gasPrice
    } = options
    const [ decimals, { customInterests, defaultInterestRate } ] = await Promise.all([
      _currencyNetwork.getDecimals(networkAddress, { networkDecimals, interestRateDecimals }),
      _currencyNetwork.getInfo(networkAddress)
    ])
    const { rawTx, ethFees } = await _transaction.prepFuncTx(
      _user.address,
      networkAddress,
      'CurrencyNetwork',
      'updateTrustline',
      [
        counterpartyAddress,
        _utils.convertToHexString(_utils.calcRaw(creditlineGiven, decimals.networkDecimals)),
        _utils.convertToHexString(_utils.calcRaw(creditlineReceived, decimals.networkDecimals)),
        _utils.convertToHexString(
          customInterests
            ? _utils.calcRaw(interestRateGiven, decimals.interestRateDecimals)
            : defaultInterestRate.raw
        ),
        _utils.convertToHexString(
          customInterests
            ? _utils.calcRaw(interestRateReceived, decimals.interestRateDecimals)
            : defaultInterestRate.raw
        )
      ],
      {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined
      }
    )
    return {
      rawTx,
      ethFees: _utils.convertToAmount(ethFees)
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
  public prepareAccept (
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
  public async confirm (rawTx: RawTxObject): Promise<any> {
    return this._transaction.confirm(rawTx)
  }

  /**
   * Returns all trustlines of a loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   */
  public async getAll (networkAddress: string): Promise<TrustlineObject[]> {
    const { _user, _utils, _currencyNetwork } = this
    const endpoint = `networks/${networkAddress}/users/${_user.address}/trustlines`
    const [ trustlines, { networkDecimals, interestRateDecimals } ] = await Promise.all([
      _utils.fetchUrl<TrustlineRaw[]>(endpoint),
      _currencyNetwork.getDecimals(networkAddress)
    ])
    return trustlines.map(
      trustline => this._formatTrustline(trustline, networkDecimals, interestRateDecimals)
    )
  }

  /**
   * Returns a trustline to a counterparty address in a specified currency network.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty of trustline.
   */
  public async get (
    networkAddress: string,
    counterpartyAddress: string
  ): Promise<TrustlineObject> {
    const { _user, _utils, _currencyNetwork } = this
    const endpoint = `networks/${networkAddress}/users/${_user.address}/trustlines/${counterpartyAddress}`
    const [ trustline, { networkDecimals, interestRateDecimals } ] = await Promise.all([
      _utils.fetchUrl<TrustlineRaw>(endpoint),
      _currencyNetwork.getDecimals(networkAddress)
    ])
    return this._formatTrustline(trustline, networkDecimals, interestRateDecimals)
  }

  /**
   * Returns trustline update requests of loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public getRequests (
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTrustlineEvent[]> {
    return this._event.get<NetworkTrustlineEvent>(networkAddress, {
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
  public getUpdates (
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTrustlineEvent[]> {
    return this._event.get<NetworkTrustlineEvent>(networkAddress, {
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
   */
  public async prepareClose (
    networkAddress: string,
    counterpartyAddress: string,
    options: PaymentOptions = {}
  ): Promise<CloseTxObject> {
    const { _user, _currencyNetwork, _transaction, _utils } = this

    // Get the users options and make sure to have a decimal.
    const { gasPrice, gasLimit, networkDecimals } = options
    const decimals = await _currencyNetwork.getDecimals(networkAddress, { networkDecimals })

    // Get close path
    const { path, maxFees, estimatedGas, value } = await this.getClosePath(
      networkAddress,
      _user.address,
      counterpartyAddress,
      {
        ...options,
        networkDecimals: decimals.networkDecimals
      }
    )

    // Make sure a path has been found.
    if (path.length > 0) {
      // Prepare the interaction with the contract.
      const { rawTx, ethFees } = await _transaction.prepFuncTx(
        _user.address,
        networkAddress,
        'CurrencyNetwork',
        'closeTrustlineByTriangularTransfer',
        [
          counterpartyAddress,
          _utils.convertToHexString(new BigNumber(maxFees.raw)),
          path.slice(1)
        ],
        {
          gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
          gasLimit: gasLimit
            ? new BigNumber(gasLimit)
            : new BigNumber(estimatedGas).multipliedBy(1.5).integerValue()
        }
      )

      return {
        rawTx,
        path,
        maxFees,
        ethFees: _utils.convertToAmount(ethFees)
      }
    } else {
      throw new Error('Could not find a path with enough capacity.')
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
   */
  public async getClosePath (
    networkAddress: string,
    senderAddress: string,
    counterpartyAddress: string,
    options: PaymentOptions = {}
  ): Promise<ClosePathObject> {
    const { _currencyNetwork, _utils } = this

    // Get the users options and make sure to have a decimal.
    const { networkDecimals, maximumHops, maximumFees } = options
    const decimals = await _currencyNetwork.getDecimals(networkAddress, { networkDecimals })

    // Define the relay endpoint.
    const endpoint = `networks/${networkAddress}/close-trustline-path-info`

    // Define properties for the relay request.
    const data = {
      from: senderAddress,
      to: counterpartyAddress
    }

    // Add additional data properties.
    if (maximumFees) {
      data['maxFees'] = maximumFees
    }
    if (maximumHops) {
      data['maxHops'] = maximumHops
    }

    // Request the relay for a path to settle down the trustline.
    const { path, estimatedGas, fees, value } = await _utils.fetchUrl<ClosePathRaw>(
      endpoint,
      {
        method: 'post',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      }
    )

    return {
      path,
      estimatedGas: new BigNumber(estimatedGas),
      maxFees: _utils.formatToAmount(fees, decimals.networkDecimals),
      value: _utils.formatToAmount(value, networkDecimals)
    }
  }

  /**
   * Formats number values of trustline retrieved from the relay server.
   * @param trustline unformatted trustline
   * @param decimals decimals object of currency network
   */
  private _formatTrustline (
    trustline: TrustlineRaw,
    networkDecimals: number,
    interestDecimals: number
  ): TrustlineObject {
    return {
      ...trustline,
      balance: this._utils.formatToAmount(trustline.balance, networkDecimals),
      given: this._utils.formatToAmount(trustline.given, networkDecimals),
      leftGiven: this._utils.formatToAmount(trustline.leftGiven, networkDecimals),
      leftReceived: this._utils.formatToAmount(trustline.leftReceived, networkDecimals),
      received: this._utils.formatToAmount(trustline.received, networkDecimals),
      interestRateGiven: this._utils.formatToAmount(trustline.interestRateGiven, interestDecimals),
      interestRateReceived: this._utils.formatToAmount(trustline.interestRateReceived, interestDecimals)
    }
  }
}
