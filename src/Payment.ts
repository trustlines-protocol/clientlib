import { BigNumber } from 'bignumber.js'

import { CurrencyNetwork } from './CurrencyNetwork'
import { Event } from './Event'
import { Transaction } from './Transaction'
import { User } from './User'
import { Utils } from './Utils'

import {
  EventFilterOptions,
  NetworkTransferEvent,
  PathObject,
  PathRaw,
  PaymentOptions,
  PaymentTxObject,
  RawTxObject,
  TxObject
} from './typings'

/**
 * The Payment class contains all payment related functions. This includes
 * trustline transfers and normal ETH transfers.
 */
export class Payment {
  private event: Event
  private user: User
  private utils: Utils
  private transaction: Transaction
  private currencyNetwork: CurrencyNetwork
  private relayApiUrl: string

  constructor(
    event: Event,
    user: User,
    utils: Utils,
    transaction: Transaction,
    currencyNetwork: CurrencyNetwork,
    relayApiUrl: string
  ) {
    this.event = event
    this.user = user
    this.utils = utils
    this.transaction = transaction
    this.currencyNetwork = currencyNetwork
    this.relayApiUrl = relayApiUrl
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
  public async prepare(
    networkAddress: string,
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<PaymentTxObject> {
    const { gasPrice, gasLimit, networkDecimals } = options
    const decimals = await this.currencyNetwork.getDecimals(networkAddress, {
      networkDecimals
    })
    const { path, maxFees, estimatedGas } = await this.getPath(
      networkAddress,
      this.user.address,
      receiverAddress,
      value,
      {
        ...options,
        networkDecimals: decimals.networkDecimals
      }
    )
    if (path.length > 0) {
      const { rawTx, ethFees } = await this.transaction.prepFuncTx(
        this.user.address,
        networkAddress,
        'CurrencyNetwork',
        'transfer',
        [
          receiverAddress,
          this.utils.convertToHexString(
            this.utils.calcRaw(value, decimals.networkDecimals)
          ),
          this.utils.convertToHexString(new BigNumber(maxFees.raw)),
          path.slice(1)
        ],
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
  public async prepareEth(
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<TxObject> {
    const { gasLimit, gasPrice } = options
    const { ethFees, rawTx } = await this.transaction.prepValueTx(
      this.user.address,
      receiverAddress,
      this.utils.calcRaw(value, 18),
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
  public async getPath(
    networkAddress: string,
    senderAddress: string,
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<PathObject> {
    const { networkDecimals, maximumHops, maximumFees } = options
    const decimals = await this.currencyNetwork.getDecimals(networkAddress, {
      networkDecimals
    })
    const data = {
      from: senderAddress,
      maxFees: maximumFees,
      maxHops: maximumHops,
      to: receiverAddress,
      value: this.utils.calcRaw(value, decimals.networkDecimals).toString()
    }
    const endpoint = `${this.relayApiUrl}/networks/${networkAddress}/path-info`
    const { estimatedGas, fees, path } = await this.utils.fetchUrl<PathRaw>(
      endpoint,
      {
        body: JSON.stringify(data),
        headers: new Headers({ 'Content-Type': 'application/json' }),
        method: 'POST'
      }
    )
    return {
      estimatedGas: new BigNumber(estimatedGas),
      maxFees: this.utils.formatToAmount(fees, decimals.networkDecimals),
      path
    }
  }

  /**
   * Returns transfer event logs of loaded user in a specified currency network.
   * @param networkAddress Address of currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public get(
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTransferEvent[]> {
    return this.event.get<NetworkTransferEvent>(networkAddress, {
      ...filter,
      type: 'Transfer'
    })
  }

  /**
   * Signs a raw transaction object as returned by `prepare`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<any> {
    return this.transaction.confirm(rawTx)
  }

  /**
   * Creates a payment request link.
   * @param networkAddress Address of a currency network.
   * @param amount Requested transfer amount.
   * @param subject Additional information for payment request.
   */
  public async createRequest(
    networkAddress: string,
    amount: number,
    subject: string
  ): Promise<string> {
    const params = [
      'paymentrequest',
      networkAddress,
      this.user.address,
      amount,
      subject
    ]
    return this.utils.createLink(params)
  }

  /**
   * Retrieve the maximum spendable amount and path to user in a network
   *
   * @param networkAddress
   * @param receiverAddress
   *
   * @return {Promise<{path: any, amount: Amount}>}
   */
  public async getMaxAmountAndPathInNetwork(
    networkAddress: string,
    receiverAddress: string
  ): Promise<any> {
    const { networkDecimals } = await this.currencyNetwork.getDecimals(
      networkAddress
    )
    const userAddress = this.user.address
    const endpoint = `${
      this.relayApiUrl
    }/networks/${networkAddress}/max-capacity-path-info`
    const result = await this.utils.fetchUrl<{
      capacity: number
      path: string[]
    }>(endpoint, {
      body: JSON.stringify({
        from: userAddress,
        to: receiverAddress
      }),
      headers: new Headers({ 'Content-Type': 'application/json' }),
      method: 'post'
    })

    return {
      amount: this.utils.formatToAmount(result.capacity, networkDecimals),
      path: result.path
    }
  }
}
