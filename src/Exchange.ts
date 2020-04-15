import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { CurrencyNetwork } from './CurrencyNetwork'
import { Event } from './Event'
import { Payment } from './Payment'
import { TLProvider } from './providers/TLProvider'
import { Transaction } from './Transaction'
import { User } from './User'

import utils from './utils'

import {
  AnyExchangeEvent,
  AnyExchangeEventRaw,
  EventFilterOptions,
  ExchangeOptions,
  ExchangeTx,
  ExchangeTxOptions,
  FeePayer,
  Order,
  Orderbook,
  OrderbookOptions,
  OrderbookRaw,
  OrderOptions,
  OrderRaw,
  OrdersQuery,
  PathObject,
  RawTxObject,
  SignedOrder,
  SignedOrderRaw,
  TLOptions,
  TxObject
} from './typings'

const CURRENCY_NETWORK = 'CurrencyNetwork'
const TOKEN = 'Token'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEFAULT_GAS_LIMIT_TAKE_ORDER = 600000

/**
 * The Exchange class contains all methods for making/taking orders, retrieving the orderbook
 * and more.
 */
export class Exchange {
  private event: Event
  private user: User
  private transaction: Transaction
  private currencyNetwork: CurrencyNetwork
  private payment: Payment
  private provider: TLProvider

  constructor(params: {
    currencyNetwork: CurrencyNetwork
    event: Event
    payment: Payment
    provider: TLProvider
    transaction: Transaction
    user: User
  }) {
    this.event = params.event
    this.user = params.user
    this.transaction = params.transaction
    this.currencyNetwork = params.currencyNetwork
    this.payment = params.payment
    this.provider = params.provider
  }

  /**
   * Returns all known exchange contract addresses.
   */
  public getExAddresses(): Promise<string[]> {
    return this.provider.fetchEndpoint<string[]>(`/exchange/exchanges`)
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
    const { makerTokenDecimals, takerTokenDecimals } = options
    const order = await this.provider.fetchEndpoint<SignedOrderRaw>(
      `exchange/order/${orderHash}`
    )
    const [
      { networkDecimals: makerDecimals },
      { networkDecimals: takerDecimals }
    ] = await Promise.all([
      this.currencyNetwork.getDecimals(order.makerTokenAddress, {
        networkDecimals: makerTokenDecimals
      }),
      this.currencyNetwork.getDecimals(order.takerTokenAddress, {
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
    const queryEndpoint = utils.buildUrl(`exchange/orders`, {
      query: {
        exchangeContractAddress: query.exchangeContractAddress,
        feeRecipient: query.feeRecipient,
        maker: query.maker,
        makerTokenAddress: query.makerTokenAddress,
        taker: query.taker,
        takerTokenAddress: query.takerTokenAddress,
        tokenAddress: query.tokenAddress,
        trader: query.trader
      }
    })
    const orders = await this.provider.fetchEndpoint<SignedOrderRaw[]>(
      queryEndpoint
    )
    const addressesMap = this._getUniqueTokenAddresses(orders)
    const decimalsMap = await this.event.getDecimalsMap(addressesMap)
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
    const { baseTokenDecimals, quoteTokenDecimals } = options
    const [
      { networkDecimals: baseDecimals },
      { networkDecimals: quoteDecimals }
    ] = await Promise.all([
      this.currencyNetwork.getDecimals(baseTokenAddress, {
        networkDecimals: baseTokenDecimals
      }),
      this.currencyNetwork.getDecimals(quoteTokenAddress, {
        networkDecimals: quoteTokenDecimals
      })
    ])
    const params = { baseTokenAddress, quoteTokenAddress }
    const endpoint = utils.buildUrl(`exchange/orderbook`, { query: params })
    const orderbook = await this.provider.fetchEndpoint<OrderbookRaw>(endpoint)
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
    const {
      makerTokenDecimals,
      takerTokenDecimals,
      expirationUnixTimestampSec = 2524604400
    } = options
    const [
      { networkDecimals: makerDecimals },
      { networkDecimals: takerDecimals }
    ] = await Promise.all([
      this.currencyNetwork.getDecimals(makerTokenAddress, {
        networkDecimals: makerTokenDecimals
      }),
      this.currencyNetwork.getDecimals(takerTokenAddress, {
        networkDecimals: takerTokenDecimals
      })
    ])
    const orderRaw = {
      availableMakerTokenAmount: utils
        .calcRaw(makerTokenValue, makerDecimals)
        .toString(),
      availableTakerTokenAmount: utils
        .calcRaw(takerTokenValue, takerDecimals)
        .toString(),
      cancelledMakerTokenAmount: '0',
      cancelledTakerTokenAmount: '0',
      exchangeContractAddress,
      expirationUnixTimestampSec: expirationUnixTimestampSec.toString(),
      feeRecipient: ZERO_ADDRESS,
      filledMakerTokenAmount: '0',
      filledTakerTokenAmount: '0',
      maker: await this.user.getAddress(),
      makerFee: '0',
      makerTokenAddress: ethers.utils.getAddress(makerTokenAddress),
      makerTokenAmount: utils
        .calcRaw(makerTokenValue, makerDecimals)
        .toString(),
      salt: Math.floor(Math.random() * 1000000000).toString(),
      taker: ZERO_ADDRESS,
      takerFee: '0',
      takerTokenAddress: ethers.utils.getAddress(takerTokenAddress),
      takerTokenAmount: utils.calcRaw(takerTokenValue, takerDecimals).toString()
    }
    const orderWithFees = await this._getFees(orderRaw)
    const orderHash = this._getOrderHashHex(orderWithFees)
    const { ecSignature } = await this.user.signMsgHash(orderHash)
    const signedOrderRaw = {
      ...orderWithFees,
      ecSignature
    }
    await this._postRequest(`/exchange/order`, signedOrderRaw)
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
      this.currencyNetwork.getDecimals(makerTokenAddress, {
        networkDecimals: makerTokenDecimals
      }),
      this.currencyNetwork.getDecimals(takerTokenAddress, {
        networkDecimals: takerTokenDecimals
      })
    ])
    const [makerPathObj, takerPathObj] = await Promise.all([
      this._getPathObj(
        makerTokenAddress,
        maker,
        await this.user.getAddress(),
        this._getPartialAmount(
          fillTakerTokenValue,
          takerTokenAmount.value,
          makerTokenAmount.value
        ),
        { networkDecimals: makerDecimals }
      ),
      this._getPathObj(
        takerTokenAddress,
        await this.user.getAddress(),
        maker,
        fillTakerTokenValue,
        {
          networkDecimals: takerDecimals
        }
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
    const { rawTx, txFees } = await this.transaction.prepareContractTransaction(
      await this.user.getAddress(),
      exchangeContractAddress,
      'Exchange',
      'fillOrderTrustlines',
      [
        orderAddresses,
        orderValues,
        utils.convertToHexString(
          utils.calcRaw(fillTakerTokenValue, takerDecimals)
        ),
        makerPathObj.path,
        takerPathObj.path,
        ecSignature.v,
        ecSignature.r,
        ecSignature.s
      ],
      {
        gasLimit: gasLimit
          ? new BigNumber(gasLimit)
          : new BigNumber(DEFAULT_GAS_LIMIT_TAKE_ORDER)
              .multipliedBy(1.5)
              .integerValue(),
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      txFees,
      makerMaxFees: makerPathObj.maxFees,
      makerPath: makerPathObj.path,
      rawTx,
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
    } = await this.currencyNetwork.getDecimals(takerTokenAddress, {
      networkDecimals: takerTokenDecimals
    })
    const orderAddresses = this._getOrderAddresses(signedOrder)
    const orderValues = this._getOrderValues(signedOrder)
    const { rawTx, txFees } = await this.transaction.prepareContractTransaction(
      await this.user.getAddress(),
      exchangeContractAddress,
      'Exchange',
      'cancelOrder',
      [
        orderAddresses,
        orderValues,
        utils.convertToHexString(
          utils.calcRaw(cancelTakerTokenValue, takerDecimals)
        )
      ],
      {
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      txFees,
      rawTx
    }
  }

  /**
   * Signs a raw transaction object as returned by `prepCancelOrder` or `prepFillOrder`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    return this.transaction.confirm(rawTx)
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
    const baseUrl = `exchange/${exchangeAddress}/users/${await this.user.getAddress()}/events`
    const parameterUrl = utils.buildUrl(baseUrl, { query: filter })
    const rawEvents = await this.provider.fetchEndpoint<AnyExchangeEventRaw[]>(
      parameterUrl
    )
    const formattedEvents = await this.event.setDecimalsAndFormat(rawEvents)
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
    const isNetwork = await this.currencyNetwork.isNetwork(tokenAddress)
    if (isNetwork) {
      return this.payment.getTransferPathInfo(tokenAddress, from, to, value, {
        networkDecimals
      })
    }
    return {
      feePayer: FeePayer.Sender,
      isNetwork: false,
      maxFees: utils.formatToAmount(0, networkDecimals),
      path: []
    }
  }

  /**
   * Helper function to retrieve all addresses of a given order and return them as an array:
   * `[ makerAddress, takerAddress, makerTokenAddress, takerTokenAddress, feeRecipientAddress ]`
   * @param order Order object to retrieve addresses from.
   */
  private _getOrderAddresses(order: Order): string[] {
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
      utils.convertToHexString(new BigNumber(order.makerTokenAmount.raw)),
      utils.convertToHexString(new BigNumber(order.takerTokenAmount.raw)),
      utils.convertToHexString(new BigNumber('0')), // NOTE fees disabled
      utils.convertToHexString(new BigNumber('0')), // NOTE fees disabled
      utils.convertToHexString(new BigNumber(order.expirationUnixTimestampSec)),
      utils.convertToHexString(new BigNumber(order.salt))
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
    return this.provider.postToEndpoint(path, payload)
  }

  /**
   * Return keccak-256 hash of given order.
   * @param order Order object.
   */
  private _getOrderHashHex(order: OrderRaw | SignedOrderRaw): string {
    const orderParts = [
      {
        type: 'address',
        value: order.exchangeContractAddress
      },
      {
        type: 'address',
        value: order.maker
      },
      {
        type: 'address',
        value: order.taker
      },
      {
        type: 'address',
        value: order.makerTokenAddress
      },
      {
        type: 'address',
        value: order.takerTokenAddress
      },
      {
        type: 'address',
        value: order.feeRecipient
      },
      {
        type: 'uint256',
        value: order.makerTokenAmount
      },
      {
        type: 'uint256',
        value: order.takerTokenAmount
      },
      {
        type: 'uint256',
        value: order.makerFee
      },
      {
        type: 'uint256',
        value: order.takerFee
      },
      {
        type: 'uint256',
        value: order.expirationUnixTimestampSec
      },
      {
        type: 'uint256',
        value: order.salt
      }
    ]
    const types = orderParts.map(part => part.type)
    const values = orderParts.map(part => part.value)
    const hash = ethers.utils.solidityKeccak256(types, values)
    return hash
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
    return {
      ...signedOrderRaw,
      availableMakerTokenAmount: utils.formatToAmount(
        signedOrderRaw.availableMakerTokenAmount,
        makerDecimals
      ),
      availableTakerTokenAmount: utils.formatToAmount(
        signedOrderRaw.availableTakerTokenAmount,
        takerDecimals
      ),
      cancelledMakerTokenAmount: utils.formatToAmount(
        signedOrderRaw.cancelledMakerTokenAmount,
        makerDecimals
      ),
      cancelledTakerTokenAmount: utils.formatToAmount(
        signedOrderRaw.cancelledTakerTokenAmount,
        takerDecimals
      ),
      filledMakerTokenAmount: utils.formatToAmount(
        signedOrderRaw.filledMakerTokenAmount,
        makerDecimals
      ),
      filledTakerTokenAmount: utils.formatToAmount(
        signedOrderRaw.filledTakerTokenAmount,
        takerDecimals
      ),
      hash: this._getOrderHashHex(signedOrderRaw),
      makerFee: utils.formatToAmount(signedOrderRaw.makerFee, makerDecimals),
      makerTokenAmount: utils.formatToAmount(
        signedOrderRaw.makerTokenAmount,
        makerDecimals
      ),
      takerFee: utils.formatToAmount(signedOrderRaw.takerFee, takerDecimals),
      takerTokenAmount: utils.formatToAmount(
        signedOrderRaw.takerTokenAmount,
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
        result[makerTokenAddress] = this.currencyNetwork.isNetwork(
          makerTokenAddress
        )
          ? CURRENCY_NETWORK
          : TOKEN
      }
      if (!result[takerTokenAddress]) {
        result[takerTokenAddress] = this.currencyNetwork.isNetwork(
          takerTokenAddress
        )
          ? CURRENCY_NETWORK
          : TOKEN
      }
      return result
    }, {})
  }
}
