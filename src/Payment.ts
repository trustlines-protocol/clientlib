import { BigNumber } from 'bignumber.js'

import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import {
  TxObject,
  TLTxObject,
  PathObject,
  PathRaw,
  PaymentOptions,
  EventFilterOptions,
  NetworkTransferEvent,
  RawTxObject
} from './typings'

/**
 * The Payment class contains all payment related functions. This includes
 * trustline transfers and normal ETH transfers.
 */
export class Payment {
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
   * Prepares ethereum transaction object for a trustlines transfer, where loaded user is sender.
   * @param networkAddress Address of a currency network.
   * @param receiverAddress Address of receiver of transfer.
   * @param value Amount to transfer in biggest unit,
   *              i.e. 1.5 if currency network has 2 decimals.
   * @param options Optional payment options. See `PaymentOptions` for more information.
   * @param options.networkDecimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user is willing to pay.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public async prepare (
    networkAddress: string,
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<TLTxObject> {
    const { _user, _currencyNetwork, _transaction, _utils } = this
    const { gasPrice, gasLimit, networkDecimals } = options
    const decimals = await _currencyNetwork.getDecimals(networkAddress, { networkDecimals })
    const { path, maxFees, estimatedGas } = await this.getPath(
      networkAddress,
      _user.address,
      receiverAddress,
      value,
      {
        ...options,
        networkDecimals: decimals.networkDecimals
      }
    )
    if (path.length > 0) {
      const { rawTx, ethFees } = await _transaction.prepFuncTx(
        _user.address,
        networkAddress,
        'CurrencyNetwork',
        'transfer',
        [
          receiverAddress,
          _utils.convertToHexString(_utils.calcRaw(value, decimals.networkDecimals)),
          _utils.convertToHexString(new BigNumber(maxFees.raw)),
          path.slice(1)
        ],
        {
          gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
          gasLimit: gasLimit ? new BigNumber(gasLimit) : new BigNumber(estimatedGas).multipliedBy(1.5).integerValue()
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
   * Prepares a ethereum transaction object for a ETH transfer, where loaded user is the sender.
   * @param receiverAddress Address of receiver of transfer.
   * @param value Amount of ETH to transfer.
   * @param options Payment options. See `PaymentOptions` for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public async prepareEth (
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<TxObject> {
    const { _user, _utils, _transaction } = this
    const { gasLimit, gasPrice } = options
    const { ethFees, rawTx } = await _transaction.prepValueTx(
      _user.address,
      receiverAddress,
      _utils.calcRaw(value, 18),
      {
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      rawTx,
      ethFees: _utils.convertToAmount(ethFees)
    }
  }

  /**
   * Returns a path for a trustlines transfer.
   * @param networkAddress Address of a currency network.
   * @param senderAddress Address of sender of transfer.
   * @param receiverAddress Address of receiver of transfer.
   * @param value Amount to transfer in biggest unit,
   *              i.e. 1.23 if currency network has 2 decimals.
   * @param options Payment options. See `PaymentOptions` for more information.
   * @param options.networkDecimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user if willing to pay.
   */
  public async getPath (
    networkAddress: string,
    senderAddress: string,
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<PathObject> {
    const { _currencyNetwork, _utils } = this
    const { networkDecimals, maximumHops, maximumFees } = options
    const decimals = await _currencyNetwork.getDecimals(networkAddress, { networkDecimals })
    const data = {
      from: senderAddress,
      to: receiverAddress,
      value: this._utils.calcRaw(value, decimals.networkDecimals).toString()
    }
    if (maximumFees) {
      data[ 'maxFees' ] = maximumFees
    }
    if (maximumHops) {
      data[ 'maxHops' ] = maximumHops
    }
    const endpoint = `networks/${networkAddress}/path-info`
    const { estimatedGas, fees, path } = await _utils.fetchUrl<PathRaw>(endpoint, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data)
    })
    return {
      estimatedGas: new BigNumber(estimatedGas),
      path,
      maxFees: _utils.formatToAmount(fees, decimals.networkDecimals)
    }
  }

  /**
   * Returns transfer event logs of loaded user in a specified currency network.
   * @param networkAddress Address of currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public get (
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTransferEvent[]> {
    return this._event.get<NetworkTransferEvent>(networkAddress, {
      ...filter,
      type: 'Transfer'
    })
  }

  /**
   * Signs a raw transaction object as returned by `prepare`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm (rawTx: RawTxObject): Promise<any> {
    return this._transaction.confirm(rawTx)
  }

  /**
   * Creates a payment request link.
   * @param networkAddress Address of a currency network.
   * @param amount Requested transfer amount.
   * @param subject Additional information for payment request.
   */
  public async createRequest (
    networkAddress: string,
    amount: number,
    subject: string
  ): Promise<string> {
    const params = [ 'paymentrequest', networkAddress, this._user.address, amount, subject ]
    return this._utils.createLink(params)
  }

  /**
   * Retrieve the maximum spendable amount and path to user in a network
   *
   * @param networkAddress
   * @param receiverAddress
   *
   * @return {Promise<{path: any, amount: Amount}>}
   */
  public async getMaxAmountAndPathInNetwork (
    networkAddress: string,
    receiverAddress: string
  ): Promise<any> {
    const { networkDecimals } = await this._currencyNetwork.getDecimals(networkAddress)
    const userAddress = this._user.address
    const endpoint = `networks/${networkAddress}/max-capacity-path-info`
    const result = await this._utils.fetchUrl<{ capacity: number, path: Array<string>}>(endpoint, {
      method: 'post',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        from: userAddress,
        to: receiverAddress
      })
    })

    return {
      path: result.path,
      amount: this._utils.formatToAmount(result.capacity, networkDecimals)
    }
  }
}
