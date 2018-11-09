import BigNumber from 'bignumber.js'

import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import {
  TLOptions,
  PaymentOptions,
  EventFilterOptions,
  TxObject,
  ClosePath,
  TrustlineObject,
  TrustlineRaw,
  NetworkTrustlineEvent,
  RawTxObject
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

  constructor(
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
   * Prepares an ethereum transaction object for creating a trustline update request. Called by initiator
   * of update request.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty who receives trustline update request.
   * @param creditlineGiven Proposed creditline limit given by iniator to counterparty,
   *              i.e. 1.23 if network has to 2 decimals.
   * @param creditlineReceived Proposed creditline limit received by iniator from counterparty,
   *                 i.e. 1.23 if network has to 2 decimals.
   * @param options Options for creating an ethereum transaction. See type `TLOptions` for more information.
   * @param options.decimals Decimals of currency network can be provided manually if known.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   */
  public async prepareUpdate(
    networkAddress: string,
    counterpartyAddress: string,
    creditlineGiven: number | string,
    creditlineReceived: number | string,
    options: TLOptions = {}
  ): Promise<TxObject> {
    const { _currencyNetwork, _transaction, _user, _utils } = this
    let { decimals, gasLimit, gasPrice } = options
    decimals = await _currencyNetwork.getDecimals(networkAddress, decimals)
    const { rawTx, ethFees } = await _transaction.prepFuncTx(
      _user.address,
      networkAddress,
      'CurrencyNetwork',
      'updateTrustline',
      [
        counterpartyAddress,
        _utils.convertToHexString(_utils.calcRaw(creditlineGiven, decimals)),
        _utils.convertToHexString(_utils.calcRaw(creditlineReceived, decimals))
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
   * @param initiatorAddress Address of user who initiated the trustline udpate request.
   * @param creditlineGiven Proposed creditline limit given by receiver to initiator,
   *              i.e. 1.23 if network has to 2 decimals.
   * @param creditlineReceived Proposed creditline limit received by iniator from receiver,
   *                 i.e. 1.23 if network has to 2 decimals.
   * @param options Options for creating a ethereum transaction. See type `TLOptions` for more information.
   * @param options.decimals Decimals of currency network can be provided manually if known.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   */
  public prepareAccept(
    networkAddress: string,
    initiatorAddress: string,
    creditlineGiven: number | string,
    creditlineReceived: number | string,
    options: TLOptions = {}
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
    return this._transaction.confirm(rawTx)
  }

  /**
   * Returns all trustlines of a loaded user in a currency network.
   * @param networkAddress Address of a currency network.
   */
  public async getAll(networkAddress: string): Promise<TrustlineObject[]> {
    const { _user, _utils, _currencyNetwork } = this
    const endpoint = `networks/${networkAddress}/users/${
      _user.address
    }/trustlines`
    const [trustlines, decimals] = await Promise.all([
      _utils.fetchUrl<TrustlineRaw[]>(endpoint),
      _currencyNetwork.getDecimals(networkAddress)
    ])
    return trustlines.map(trustline =>
      this._formatTrustline(trustline, decimals)
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
    const { _user, _utils, _currencyNetwork } = this
    const endpoint = `networks/${networkAddress}/users/${
      _user.address
    }/trustlines/${counterpartyAddress}`
    const [trustline, decimals] = await Promise.all([
      _utils.fetchUrl<TrustlineRaw>(endpoint),
      _currencyNetwork.getDecimals(networkAddress)
    ])
    return this._formatTrustline(trustline, decimals)
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
  public getUpdates(
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTrustlineEvent[]> {
    return this._event.get<NetworkTrustlineEvent>(networkAddress, {
      ...filter,
      type: 'TrustlineUpdate'
    })
  }

  /**
   * Prepares an ethereum transaction object for settle a trustline.
   * @param networkAddress Address of a currency network.
   * @param counterpartyAddress Address of counterparty to who the trustline should be settled.
   * @param options Payment options. See `PaymentOptions` for more information.
   * @param options.decimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user if willing to pay.
   */
  public async prepareSettle(
    networkAddress: string,
    counterpartyAddress: string,
    options: PaymentOptions = {}
  ): Promise<TxObject> {
    const { _user, _currencyNetwork, _transaction, _utils } = this

    // Get the users options and make sure to have a decimal.
    let { gasPrice, gasLimit, decimals, maximumHops, maximumFees } = options
    decimals = await _currencyNetwork.getDecimals(networkAddress, decimals)

    // Define the relay endpoint.
    const endpoint = `networks/${networkAddress}/close-trustline-path-info`

    // Define properties for the relay request.
    const data = {
      from: _user.address,
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
    const { path, estimatedGas, fees, value } = await _utils.fetchUrl<
      ClosePath
    >(endpoint, {
      method: 'post',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    })

    // Make sure a path has been found.
    if (path.length > 0) {
      // Prepare the interaction with the contract.
      const { rawTx, ethFees } = await _transaction.prepFuncTx(
        _user.address,
        networkAddress,
        'CurrencyNetwork',
        'transfer',
        [
          counterpartyAddress,
          _utils.convertToHexString(_utils.calcRaw(value, decimals)),
          _utils.convertToHexString(
            new BigNumber(_utils.formatToAmount(fees, decimals).raw)
          ),
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
        ethFees: _utils.convertToAmount(ethFees)
      }
    } else {
      throw new Error('Could not find a path with enough capacity.')
    }
  }

  /**
   * Formats number values of trustline retrieved from the relay server.
   * @param trustline unformatted trustline
   * @param decimals decimals of currency network
   */
  private _formatTrustline(
    trustline: TrustlineRaw,
    decimals: number
  ): TrustlineObject {
    return {
      ...trustline,
      balance: this._utils.formatToAmount(trustline.balance, decimals),
      given: this._utils.formatToAmount(trustline.given, decimals),
      leftGiven: this._utils.formatToAmount(trustline.leftGiven, decimals),
      leftReceived: this._utils.formatToAmount(
        trustline.leftReceived,
        decimals
      ),
      received: this._utils.formatToAmount(trustline.received, decimals)
    }
  }
}
