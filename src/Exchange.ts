import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import { Payment } from './Payment'
import {
  ExchangeOptions,
  ExchangeTx,
  ExchangeTxOptions,
  Order,
  OrderRaw,
  Orderbook,
  OrderbookRaw,
  OrderbookOptions,
  SignedOrder,
  SignedOrderRaw,
  TLOptions,
  PathObject,
  TxObject,
  OrderOptions,
  EventFilterOptions,
  AnyExchangeEvent,
  AnyExchangeEventRaw,
  OrdersQuery,
  RawTxObject
} from './typings'

import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'
import * as ethABI from 'ethereumjs-abi'

const CURRENCY_NETWORK = 'CurrencyNetwork'
const TOKEN = 'Token'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

/**
 * The Exchange class contains all methods for making/taking orders, retrieving the orderbook
 * and more.
 */
export class Exchange {
  private _event: Event
  private _user: User
  private _utils: Utils
  private _transaction: Transaction
  private _currencyNetwork: CurrencyNetwork
  private _payment: Payment

  constructor(
    event: Event,
    user: User,
    utils: Utils,
    transaction: Transaction,
    currencyNetwork: CurrencyNetwork,
    payment: Payment
  ) {
    this._event = event
    this._user = user
    this._utils = utils
    this._transaction = transaction
    this._currencyNetwork = currencyNetwork
    this._payment = payment
  }

  /**
   * Returns all known exchange contract addresses.
   */
  public getExAddresses(): Promise<string[]> {
    return this._utils.fetchUrl<string[]>('exchange/exchanges')
  }

  /**
   * Returns a specific order by its hash.
   * @param orderHash keccak-256 hash of order.
   * @param options See `OrderOptions` for more details.
   * @param options.makerTokenDecimals Decimals of maker token can be provided manually.
   *                                   NOTE: If maker token is NOT a currency network, then decimals have to be explicitly given.
   * @param options.takerTokenDecimals Decimals of taker token can be provided manually.
   *                                   NOTE: If taker token is NOT a currency network, then decimals have to be explicitly given.
   */
  public async getOrderByHash(
    orderHash: string,
    options: OrderOptions = {}
  ): Promise<SignedOrder> {
    const { _currencyNetwork, _utils } = this
    const { makerTokenDecimals, takerTokenDecimals } = options
    const order = await _utils.fetchUrl<SignedOrderRaw>(
      `exchange/order/${orderHash}`
    )
    const [
      { networkDecimals: makerDecimals },
      { networkDecimals: takerDecimals }
    ] = await Promise.all([
      _currencyNetwork.getDecimals(order.makerTokenAddress, {
        networkDecimals: makerTokenDecimals
      }),
      _currencyNetwork.getDecimals(order.takerTokenAddress, {
        networkDecimals: takerTokenDecimals
      })
    ])
    return this._formatOrderRaw(order, makerDecimals, takerDecimals)
  }

  /**
   * Returns orders that match given query parameters.
   * @param query See `OrdersQuery` for more information.
   * @param query.exchangeContractAddress Orders for this exchange address.
   * @param query.tokenAddress Orders where `makerTokenAddress` or `takerTokenAddress` is `tokenAddress`.
   * @param query.makerTokenAddress Orders with specified makerTokenAddress.
   * @param query.takerTokenAddress Orders with specified takerTokenAddress.
   * @param query.maker Orders with specified maker address.
   * @param query.taker Orders with specified taker address.
   * @param query.trader Orders where `maker` or `taker` is `trader`.
   */
  public async getOrders(query: OrdersQuery = {}): Promise<SignedOrder[]> {
    const { _event, _utils } = this
    const queryEndpoint = _utils.buildUrl('exchange/orders', {
      exchangeContractAddress: query.exchangeContractAddress,
      tokenAddress: query.tokenAddress,
      makerTokenAddress: query.makerTokenAddress,
      takerTokenAddress: query.takerTokenAddress,
      trader: query.trader,
      maker: query.maker,
      taker: query.taker,
      feeRecipient: query.feeRecipient
    })
    const orders = await _utils.fetchUrl<SignedOrderRaw[]>(queryEndpoint)
    const addressesMap = this._getUniqueTokenAddresses(orders)
    const decimalsMap = await _event.getDecimalsMap(addressesMap)
    return orders.map(order =>
      this._formatOrderRaw(
        order,
        decimalsMap[order.makerTokenAddress],
        decimalsMap[order.takerTokenAddress]
      )
    )
  }

  /**
   * Returns the orderbook for a given token pair.
   * @param baseTokenAddress Address of base token.
   * @param quoteTokenAddress Address of quote token.
   * @param options See `OrderbookOptions` for more details.
   * @param options.baseTokenDecimals Decimals of base token can be provided manually.
   *                                  NOTE: If base token is NOT a currency network, then decimals have to be explicitly given.
   * @param options.quoteTokenDecimals Decimals of quote token can be provided manually.
   *                                   NOTE: If quote token is NOT a currency network, then decimals have to be explicitly given.
   */
  public async getOrderbook(
    baseTokenAddress: string,
    quoteTokenAddress: string,
    options: OrderbookOptions = {}
  ): Promise<Orderbook> {
    const { _currencyNetwork, _utils } = this
    const { baseTokenDecimals, quoteTokenDecimals } = options
    const [
      { networkDecimals: baseDecimals },
      { networkDecimals: quoteDecimals }
    ] = await Promise.all([
      _currencyNetwork.getDecimals(baseTokenAddress, {
        networkDecimals: baseTokenDecimals
      }),
      _currencyNetwork.getDecimals(quoteTokenAddress, {
        networkDecimals: quoteTokenDecimals
      })
    ])
    const params = { baseTokenAddress, quoteTokenAddress }
    const endpoint = _utils.buildUrl('exchange/orderbook', params)
    const orderbook = await _utils.fetchUrl<OrderbookRaw>(endpoint)
    const { asks, bids } = orderbook
    return {
      asks: asks.map(a => this._formatOrderRaw(a, baseDecimals, quoteDecimals)),
      bids: bids.map(b => this._formatOrderRaw(b, quoteDecimals, baseDecimals))
    }
  }

  /**
   * Creates an order and posts it to the relay server. If successful, the method returns the created order.
   * @param exchangeContractAddress Address of exchange contract.
   * @param makerTokenAddress Address of token the maker (loaded user) is offering.
   * @param takerTokenAddress Address of token the maker (loaded user) is requesting from the taker.
   * @param makerTokenValue Amount of token the maker (loaded user) is offering.
   * @param takerTokenValue Amount of token the maker (loaded user) is requesting from the taker.
   * @param options See `ExchangeOptions` for more information.
   * @param options.makerTokenDecimals Decimals of maker token can be provided manually.
   *                                   NOTE: If maker token is NOT a currency network, then decimals have to be explicitly given.
   * @param options.takerTokenDecimals Decimals of taker token can be provided manually.
   *                                   NOTE: If taker token is NOT a currency network, then decimals have to be explicitly given.
   * @param options.expirationUnixTimestampSec Date on when the order will expire in UNIX time.
   */
  public async makeOrder(
    exchangeContractAddress: string,
    makerTokenAddress: string,
    takerTokenAddress: string,
    makerTokenValue: number | string,
    takerTokenValue: number | string,
    options: ExchangeOptions = {}
  ): Promise<SignedOrder> {
    const { _currencyNetwork, _user, _utils } = this
    const {
      makerTokenDecimals,
      takerTokenDecimals,
      expirationUnixTimestampSec = 2524604400
    } = options
    const [
      { networkDecimals: makerDecimals },
      { networkDecimals: takerDecimals }
    ] = await Promise.all([
      _currencyNetwork.getDecimals(makerTokenAddress, {
        networkDecimals: makerTokenDecimals
      }),
      _currencyNetwork.getDecimals(takerTokenAddress, {
        networkDecimals: takerTokenDecimals
      })
    ])
    const orderRaw = {
      exchangeContractAddress,
      expirationUnixTimestampSec: expirationUnixTimestampSec.toString(),
      feeRecipient: ZERO_ADDRESS,
      maker: _user.address,
      makerFee: '0',
      makerTokenAddress: ethUtils.toChecksumAddress(makerTokenAddress),
      makerTokenAmount: _utils
        .calcRaw(makerTokenValue, makerDecimals)
        .toString(),
      salt: Math.floor(Math.random() * 1000000000).toString(),
      taker: ZERO_ADDRESS,
      takerFee: '0',
      takerTokenAddress: ethUtils.toChecksumAddress(takerTokenAddress),
      takerTokenAmount: _utils
        .calcRaw(takerTokenValue, takerDecimals)
        .toString(),
      filledMakerTokenAmount: '0',
      filledTakerTokenAmount: '0',
      cancelledMakerTokenAmount: '0',
      cancelledTakerTokenAmount: '0',
      availableMakerTokenAmount: _utils
        .calcRaw(makerTokenValue, makerDecimals)
        .toString(),
      availableTakerTokenAmount: _utils
        .calcRaw(takerTokenValue, takerDecimals)
        .toString()
    }
    const orderWithFees = await this._getFees(orderRaw)
    const orderHash = this._getOrderHashHex(orderWithFees)
    const { ecSignature } = await _user.signMsgHash(orderHash)
    const signedOrderRaw = {
      ...orderWithFees,
      ecSignature
    }
    await this._postRequest('exchange/order', signedOrderRaw)
    return this._formatOrderRaw(signedOrderRaw, makerDecimals, takerDecimals)
  }

  /**
   * Prepares an ethereum transaction object for taking an order.
   * @param signedOrder The order to take as returned by `getOrderbook`, `getOrders` or `getOrderByHash`.
   * @param fillTakerTokenValue Amount of tokens the taker (loaded user) wants to fill.
   * @param options See `ExchangeTxOptions` for more information.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   * @param options.makerTokenDecimals Decimals of maker token can be provided manually.
   *                                   NOTE: If maker token is NOT a currency network, then decimals have to be explicitly given.
   * @param options.takerTokenDecimals Decimals of taker token can be provided manually.
   *                                   NOTE: If taker token is NOT a currency network, then decimals have to be explicitly given.
   */
  public async prepTakeOrder(
    signedOrder: SignedOrder,
    fillTakerTokenValue: number | string,
    options: ExchangeTxOptions = {}
  ): Promise<ExchangeTx> {
    const {
      exchangeContractAddress,
      maker,
      makerTokenAddress,
      takerTokenAddress,
      makerTokenAmount,
      takerTokenAmount,
      ecSignature
    } = signedOrder
    const {
      gasLimit,
      gasPrice,
      makerTokenDecimals,
      takerTokenDecimals
    } = options
    const [
      { networkDecimals: makerDecimals },
      { networkDecimals: takerDecimals }
    ] = await Promise.all([
      this._currencyNetwork.getDecimals(makerTokenAddress, {
        networkDecimals: makerTokenDecimals
      }),
      this._currencyNetwork.getDecimals(takerTokenAddress, {
        networkDecimals: takerTokenDecimals
      })
    ])
    const [makerPathObj, takerPathObj] = await Promise.all([
      this._getPathObj(
        makerTokenAddress,
        maker,
        this._user.address,
        this._getPartialAmount(
          fillTakerTokenValue,
          takerTokenAmount.value,
          makerTokenAmount.value
        ),
        { networkDecimals: makerDecimals }
      ),
      this._getPathObj(
        takerTokenAddress,
        this._user.address,
        maker,
        fillTakerTokenValue,
        { networkDecimals: takerDecimals }
      )
    ])
    const orderAddresses = this._getOrderAddresses(signedOrder)
    const orderValues = this._getOrderValues(signedOrder)

    if (
      (makerPathObj.path.length === 0 && makerPathObj.isNetwork) ||
      (takerPathObj.path.length === 0 && takerPathObj.isNetwork)
    ) {
      throw new Error('Could not find a path with enough capacity')
    }
    const { rawTx, ethFees } = await this._transaction.prepFuncTx(
      this._user.address,
      exchangeContractAddress,
      'Exchange',
      'fillOrderTrustlines',
      [
        orderAddresses,
        orderValues,
        this._utils.convertToHexString(
          this._utils.calcRaw(fillTakerTokenValue, takerDecimals)
        ),
        makerPathObj.path.length === 1
          ? makerPathObj.path
          : makerPathObj.path.slice(1),
        takerPathObj.path.length === 1
          ? takerPathObj.path
          : takerPathObj.path.slice(1),
        ecSignature.v,
        ecSignature.r,
        ecSignature.s
      ],
      {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasLimit
          ? new BigNumber(gasLimit)
          : takerPathObj.estimatedGas
              .plus(makerPathObj.estimatedGas)
              .multipliedBy(1.5)
              .integerValue()
      }
    )
    return {
      rawTx,
      ethFees: this._utils.convertToAmount(ethFees),
      makerMaxFees: makerPathObj.maxFees,
      makerPath: makerPathObj.path,
      takerMaxFees: takerPathObj.maxFees,
      takerPath: takerPathObj.path
    }
  }

  /**
   * Prepares an ethereum transaction for cancelling an order.
   * @param signedOrder The order to cancel as returned by `getOrderbook`, `getOrders` or `getOrderByHash`.
   * @param cancelTakerTokenValue Amount of tokens the maker (loaded user) wants to cancel.
   * @param options See `ExchangeTxOptions` for more information.
   * @param options.gasLimit Custom gas limit.
   * @param options.gasPrice Custom gas price.
   * @param options.makerTokenDecimals Decimals of maker token can be provided manually.
   *                                   NOTE: If maker token is NOT a currency network, then decimals have to be explicitly given.
   * @param options.takerTokenDecimals Decimals of taker token can be provided manually.
   *                                   NOTE: If taker token is NOT a currency network, then decimals have to be explicitly given.
   */
  public async prepCancelOrder(
    signedOrder: SignedOrder,
    cancelTakerTokenValue: number | string,
    options: ExchangeTxOptions = {}
  ): Promise<TxObject> {
    const { exchangeContractAddress, takerTokenAddress } = signedOrder
    const { gasLimit, gasPrice, takerTokenDecimals } = options
    const {
      networkDecimals: takerDecimals
    } = await this._currencyNetwork.getDecimals(takerTokenAddress, {
      networkDecimals: takerTokenDecimals
    })
    const orderAddresses = this._getOrderAddresses(signedOrder)
    const orderValues = this._getOrderValues(signedOrder)
    const { rawTx, ethFees } = await this._transaction.prepFuncTx(
      this._user.address,
      exchangeContractAddress,
      'Exchange',
      'cancelOrder',
      [
        orderAddresses,
        orderValues,
        this._utils.convertToHexString(
          this._utils.calcRaw(cancelTakerTokenValue, takerDecimals)
        )
      ],
      {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined
      }
    )
    return {
      rawTx,
      ethFees: this._utils.convertToAmount(ethFees)
    }
  }

  /**
   * Signs a raw transaction object as returned by `prepCancelOrder` or `prepFillOrder`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    return this._transaction.confirm(rawTx)
  }

  /**
   * Returns event logs of the Exchange contract for the loaded user.
   * @param exchangeAddress Address of Exchange contract.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   * @param filter.type Available event types are `LogFill` and `LogCancel`.
   * @param filter.fromBlock Start of block range for event logs.
   */
  public async getLogs(
    exchangeAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<AnyExchangeEvent[]> {
    const { _event, _user, _utils } = this
    const baseUrl = `exchange/${exchangeAddress}/users/${_user.address}/events`
    const parameterUrl = _utils.buildUrl(baseUrl, filter)
    const rawEvents = await _utils.fetchUrl<AnyExchangeEventRaw[]>(parameterUrl)
    const formattedEvents = await _event.setDecimalsAndFormat(rawEvents)
    return formattedEvents
  }

  /**
   * Returns a path for a transfer and an empty path if given token address is not a currency network.
   * @param tokenAddress Address of token.
   * @param from Address of sender of transfer.
   * @param to Address of receiver of transfer.
   * @param value Amount to transfer.
   * @param options See `TLOptions` for more information.
   * @param options.decimals Decimals of token can be provided manually.
   *                         NOTE: If token address is NOT a currency network, then decimals have to be explicit.
   */
  private async _getPathObj(
    tokenAddress: string,
    from: string,
    to: string,
    value: number | string,
    options: TLOptions
  ): Promise<PathObject> {
    const { networkDecimals } = options
    const isNetwork = await this._currencyNetwork.isNetwork(tokenAddress)
    if (isNetwork) {
      return this._payment.getPath(tokenAddress, from, to, value, {
        networkDecimals
      })
    }
    return {
      path: [],
      maxFees: this._utils.formatToAmount(0, networkDecimals),
      estimatedGas: new BigNumber(40000),
      isNetwork: false
    }
  }

  /**
   * Helper function to retrieve all addresses of a given order and return them as an array:
   * `[ makerAddress, takerAddress, makerTokenAddress, takerTokenAddress, feeRecipientAddress ]`
   * @param order Order object to retrieve addresses from.
   */
  private _getOrderAddresses(order: Order): Array<string> {
    return [
      order.maker,
      ZERO_ADDRESS,
      order.makerTokenAddress,
      order.takerTokenAddress,
      order.feeRecipient
    ]
  }

  /**
   * Helper function to retrieve all values of a given order and return them as an array.
   * `[ makerTokenAmount, takerTokenAmount, makeFee, takerFee, expirationUnixTimestampSec, salt ]`
   * @param order Order object to retrieve values from.
   */
  private _getOrderValues(order: Order): string[] {
    return [
      this._utils.convertToHexString(new BigNumber(order.makerTokenAmount.raw)),
      this._utils.convertToHexString(new BigNumber(order.takerTokenAmount.raw)),
      this._utils.convertToHexString(new BigNumber('0')), // NOTE fees disabled
      this._utils.convertToHexString(new BigNumber('0')), // NOTE fees disabled
      this._utils.convertToHexString(
        new BigNumber(order.expirationUnixTimestampSec)
      ),
      this._utils.convertToHexString(new BigNumber(order.salt))
    ]
  }

  /**
   * Calculates partial value given a numerator and denominator.
   * @param numerator Numerator.
   * @param denominator Denominator.
   * @param target Target to calculate partial of.
   */
  private _getPartialAmount(
    numerator: number | string,
    denominator: number | string,
    target: number | string
  ): number {
    const bnNumerator = new BigNumber(numerator)
    const bnDenominator = new BigNumber(denominator)
    const bnTarget = new BigNumber(target)
    return bnNumerator
      .times(bnTarget)
      .dividedBy(bnDenominator)
      .toNumber()
  }

  /**
   * Returns fees of a given order.
   * @param order Unformatted Order object as returned by relay.
   */
  private _getFees(order: OrderRaw): Promise<OrderRaw> {
    // NOTE: Fees are disabled for now
    return Promise.resolve({
      ...order,
      feeRecipient: ZERO_ADDRESS,
      makerFee: '0',
      takerFee: '0'
    })
  }

  /**
   * Sends a POST request to given `path` with given `payload`.
   * @param path Endpoint to send request to.
   * @param payload Body of POST request.
   */
  private _postRequest(path: string, payload: any): Promise<any> {
    return this._utils.fetchUrl(path, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
  }

  /**
   * Return keccak-256 hash of given order.
   * @param order Order object.
   */
  private _getOrderHashHex(order: OrderRaw | SignedOrderRaw): string {
    const orderParts = [
      {
        value: order.exchangeContractAddress,
        type: 'address'
      },
      {
        value: order.maker,
        type: 'address'
      },
      {
        value: order.taker,
        type: 'address'
      },
      {
        value: order.makerTokenAddress,
        type: 'address'
      },
      {
        value: order.takerTokenAddress,
        type: 'address'
      },
      {
        value: order.feeRecipient,
        type: 'address'
      },
      {
        value: order.makerTokenAmount,
        type: 'uint256'
      },
      {
        value: order.takerTokenAmount,
        type: 'uint256'
      },
      {
        value: order.makerFee,
        type: 'uint256'
      },
      {
        value: order.takerFee,
        type: 'uint256'
      },
      {
        value: order.expirationUnixTimestampSec,
        type: 'uint256'
      },
      {
        value: order.salt,
        type: 'uint256'
      }
    ]
    const types = orderParts.map(part => part.type)
    const values = orderParts.map(part => part.value)
    const hashBuff = ethABI.soliditySHA3(types, values)
    return ethUtils.bufferToHex(hashBuff)
  }

  /**
   * Formats number values of given order to Amount objects and calculates the hash of given order.
   * @param signedOrderRaw Signed order object unformatted.
   * @param makerDecimals Decimals of maker token.
   * @param takerDecimals Decimals of taker token.
   */
  private _formatOrderRaw(
    signedOrderRaw: SignedOrderRaw,
    makerDecimals: number,
    takerDecimals: number
  ): SignedOrder {
    const { _utils } = this
    return {
      ...signedOrderRaw,
      hash: this._getOrderHashHex(signedOrderRaw),
      makerTokenAmount: _utils.formatToAmount(
        signedOrderRaw.makerTokenAmount,
        makerDecimals
      ),
      takerTokenAmount: _utils.formatToAmount(
        signedOrderRaw.takerTokenAmount,
        takerDecimals
      ),
      makerFee: _utils.formatToAmount(signedOrderRaw.makerFee, makerDecimals),
      takerFee: _utils.formatToAmount(signedOrderRaw.takerFee, takerDecimals),
      filledMakerTokenAmount: _utils.formatToAmount(
        signedOrderRaw.filledMakerTokenAmount,
        makerDecimals
      ),
      filledTakerTokenAmount: _utils.formatToAmount(
        signedOrderRaw.filledTakerTokenAmount,
        takerDecimals
      ),
      cancelledMakerTokenAmount: _utils.formatToAmount(
        signedOrderRaw.cancelledMakerTokenAmount,
        makerDecimals
      ),
      cancelledTakerTokenAmount: _utils.formatToAmount(
        signedOrderRaw.cancelledTakerTokenAmount,
        takerDecimals
      ),
      availableMakerTokenAmount: _utils.formatToAmount(
        signedOrderRaw.availableMakerTokenAmount,
        makerDecimals
      ),
      availableTakerTokenAmount: _utils.formatToAmount(
        signedOrderRaw.availableTakerTokenAmount,
        takerDecimals
      )
    }
  }

  /**
   * Helper function for filtering all unique addresses from an array of orders.
   * It also maps the unique addresses to whether it is a currency network or a token.
   * @param orders Unformatted orders as returned by the relay.
   */
  private _getUniqueTokenAddresses(orders: OrderRaw[]): object {
    return orders.reduce((result, order) => {
      const { makerTokenAddress, takerTokenAddress } = order
      if (!result[makerTokenAddress]) {
        result[makerTokenAddress] = this._currencyNetwork.isNetwork(
          makerTokenAddress
        )
          ? CURRENCY_NETWORK
          : TOKEN
      }
      if (!result[takerTokenAddress]) {
        result[takerTokenAddress] = this._currencyNetwork.isNetwork(
          takerTokenAddress
        )
          ? CURRENCY_NETWORK
          : TOKEN
      }
      return result
    }, {})
  }
}
