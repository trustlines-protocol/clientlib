import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import { Payment } from './Payment'
import {
  ExchangeOptions,
  ExchangeTx,
  Order,
  OrderRaw,
  Orderbook,
  OrderbookRaw,
  OrderbookOptions,
  SignedOrder,
  TLOptions,
  PathObject,
  TxObject,
  OrderOptions
} from './typings'

import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'
import * as ethABI from 'ethereumjs-abi'

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

  constructor (
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

  public getExAddresses (): Promise<string[]> {
    return this._utils.fetchUrl<string[]>('exchange/exchanges')
  }

  public async getOrderByHash (
    orderHash: string,
    options: OrderOptions = {}
  ): Promise<Order> {
    const { _currencyNetwork, _utils } = this
    const { makerTokenDecimals, takerTokenDecimals } = options
    const order = await _utils.fetchUrl<OrderRaw>(`exchange/order/${orderHash}`)
    const [ makerDecimals, takerDecimals ] = await Promise.all([
      _currencyNetwork.getDecimals(order.makerTokenAddress, makerTokenDecimals),
      _currencyNetwork.getDecimals(order.takerTokenAddress, takerTokenDecimals)
    ])
    const {
      makerTokenAmount,
      takerTokenAmount,
      makerFee,
      takerFee,
      filledMakerTokenAmount,
      filledTakerTokenAmount,
      cancelledMakerTokenAmount,
      cancelledTakerTokenAmount,
      availableMakerTokenAmount,
      availableTakerTokenAmount
      } = order
    return {
      ...order,
      makerTokenAmount: _utils.formatAmount(makerTokenAmount, makerDecimals),
      takerTokenAmount: _utils.formatAmount(takerTokenAmount, takerDecimals),
      makerFee: _utils.formatAmount(makerFee, makerDecimals),
      takerFee: _utils.formatAmount(takerFee, takerDecimals),
      filledMakerTokenAmount: _utils.formatAmount(filledMakerTokenAmount, makerDecimals),
      filledTakerTokenAmount: _utils.formatAmount(filledTakerTokenAmount, takerDecimals),
      cancelledMakerTokenAmount: _utils.formatAmount(cancelledMakerTokenAmount, makerDecimals),
      cancelledTakerTokenAmount: _utils.formatAmount(cancelledTakerTokenAmount, takerDecimals),
      availableMakerTokenAmount: _utils.formatAmount(availableMakerTokenAmount, makerDecimals),
      availableTakerTokenAmount: _utils.formatAmount(availableTakerTokenAmount, takerDecimals)
    }
  }

  public async getOrderbook (
    baseTokenAddress: string,
    quoteTokenAddress: string,
    options: OrderbookOptions = {}
  ): Promise<Orderbook> {
    const { _currencyNetwork, _utils } = this
    const { baseTokenDecimals, quoteTokenDecimals } = options
    const [ baseDecimals, quoteDecimals ] = await Promise.all([
      _currencyNetwork.getDecimals(baseTokenAddress, baseTokenDecimals),
      _currencyNetwork.getDecimals(quoteTokenAddress, quoteTokenDecimals)
    ])
    const params = { baseTokenAddress, quoteTokenAddress }
    const endpoint = _utils.buildUrl('exchange/orderbook', params)
    const orderbook = await _utils.fetchUrl<OrderbookRaw>(endpoint)
    const { asks, bids } = orderbook
    return {
      asks: asks.map(a => ({
        ...a,
        hash: this._getOrderHashHex(a),
        makerTokenAmount: _utils.formatAmount(a.makerTokenAmount, baseDecimals),
        takerTokenAmount: _utils.formatAmount(a.takerTokenAmount, quoteDecimals),
        makerFee: _utils.formatAmount(a.makerFee, baseDecimals),
        takerFee: _utils.formatAmount(a.takerFee, quoteDecimals),
        filledMakerTokenAmount: _utils.formatAmount(a.filledMakerTokenAmount, baseDecimals),
        filledTakerTokenAmount: _utils.formatAmount(a.filledTakerTokenAmount, quoteDecimals),
        cancelledMakerTokenAmount: _utils.formatAmount(a.cancelledMakerTokenAmount, baseDecimals),
        cancelledTakerTokenAmount: _utils.formatAmount(a.cancelledTakerTokenAmount, quoteDecimals),
        availableMakerTokenAmount: _utils.formatAmount(a.availableMakerTokenAmount, baseDecimals),
        availableTakerTokenAmount: _utils.formatAmount(a.availableTakerTokenAmount, quoteDecimals)
      })),
      bids: bids.map(b => ({
        ...b,
        hash: this._getOrderHashHex(b),
        makerTokenAmount: _utils.formatAmount(b.makerTokenAmount, quoteDecimals),
        takerTokenAmount: _utils.formatAmount(b.takerTokenAmount, baseDecimals),
        makerFee: _utils.formatAmount(b.makerFee, quoteDecimals),
        takerFee: _utils.formatAmount(b.takerFee, baseDecimals),
        filledMakerTokenAmount: _utils.formatAmount(b.filledMakerTokenAmount, quoteDecimals),
        filledTakerTokenAmount: _utils.formatAmount(b.filledTakerTokenAmount, baseDecimals),
        cancelledMakerTokenAmount: _utils.formatAmount(b.cancelledMakerTokenAmount, quoteDecimals),
        cancelledTakerTokenAmount: _utils.formatAmount(b.cancelledTakerTokenAmount, baseDecimals),
        availableMakerTokenAmount: _utils.formatAmount(b.availableMakerTokenAmount, quoteDecimals),
        availableTakerTokenAmount: _utils.formatAmount(b.availableTakerTokenAmount, baseDecimals)
      }))
    }
  }

  public async makeOrder (
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
    const [ makerDecimals, takerDecimals ] = await Promise.all([
      _currencyNetwork.getDecimals(makerTokenAddress, makerTokenDecimals),
      _currencyNetwork.getDecimals(takerTokenAddress, takerTokenDecimals)
    ])
    const order = {
      exchangeContractAddress,
      expirationUnixTimestampSec: expirationUnixTimestampSec.toString(),
      feeRecipient: ZERO_ADDRESS,
      maker: _user.address,
      makerFee: _utils.formatAmount(0, makerDecimals),
      makerTokenAddress: ethUtils.toChecksumAddress(makerTokenAddress),
      makerTokenAmount: _utils.formatAmount(
        _utils.calcRaw(makerTokenValue, makerDecimals), makerDecimals
      ),
      salt: Math.floor(Math.random() * 1000000000).toString(),
      taker: ZERO_ADDRESS,
      takerFee: _utils.formatAmount(0, makerDecimals),
      takerTokenAddress: ethUtils.toChecksumAddress(takerTokenAddress),
      takerTokenAmount: _utils.formatAmount(
        _utils.calcRaw(takerTokenValue, takerDecimals), takerDecimals
      )
    }
    const orderWithFees = await this._getFees(order)
    const orderHash = this._getOrderHashHex(orderWithFees)
    const { ecSignature } = await _user.signMsgHash(orderHash)
    const signedOrder = {
      ...orderWithFees,
      ecSignature
    }
    await this._postRequest('exchange/order', {
      ...signedOrder,
      makerFee: orderWithFees.makerFee.raw,
      takerFee: orderWithFees.takerFee.raw,
      makerTokenAmount: orderWithFees.makerTokenAmount.raw,
      takerTokenAmount: orderWithFees.takerTokenAmount.raw
    })
    return ({
      ...signedOrder,
      hash: orderHash,
      filledMakerTokenAmount: _utils.formatAmount(0, makerDecimals),
      filledTakerTokenAmount: _utils.formatAmount(0, takerDecimals),
      cancelledMakerTokenAmount: _utils.formatAmount(0, makerDecimals),
      cancelledTakerTokenAmount: _utils.formatAmount(0, takerDecimals),
      availableMakerTokenAmount: signedOrder.makerTokenAmount,
      availableTakerTokenAmount: signedOrder.takerTokenAmount
    })
  }

  public async prepTakeOrder (
    signedOrder: SignedOrder,
    fillTakerTokenValue: number | string,
    options: ExchangeOptions = {}
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
    const [ makerDecimals, takerDecimals, orderWithFees ] = await Promise.all([
      this._currencyNetwork.getDecimals(makerTokenAddress, makerTokenDecimals),
      this._currencyNetwork.getDecimals(takerTokenAddress, takerTokenDecimals),
      this._getFees(signedOrder)
    ])
    const [ makerPathObj, takerPathObj ] = await Promise.all([
      this._getPathObj(
        makerTokenAddress,
        maker,
        this._user.address,
        this._getPartialAmount(fillTakerTokenValue, takerTokenAmount.value, makerTokenAmount.value),
        { decimals: makerDecimals }
      ),
      this._getPathObj(
        takerTokenAddress,
        this._user.address,
        maker,
        fillTakerTokenValue,
        { decimals: takerDecimals }
      )
    ])
    const orderAddresses = this._getOrderAddresses(orderWithFees)
    const orderValues = this._getOrderValues(orderWithFees)

    if ((makerPathObj.path.length === 0 && makerPathObj.isNetwork) ||
        (takerPathObj.path.length === 0 && takerPathObj.isNetwork)) {
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
        this._utils.calcRaw(fillTakerTokenValue, takerDecimals),
        makerPathObj.path.length === 1 ? makerPathObj.path : makerPathObj.path.slice(1),
        takerPathObj.path.length === 1 ? takerPathObj.path : takerPathObj.path.slice(1),
        ecSignature.v,
        ecSignature.r,
        ecSignature.s
      ], {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasLimit
          ? new BigNumber(gasLimit)
          : takerPathObj.estimatedGas.plus(makerPathObj.estimatedGas).multipliedBy(1.5)
      }
    )
    return {
      rawTx,
      ethFees,
      makerMaxFees: makerPathObj.maxFees,
      makerPath: makerPathObj.path,
      takerMaxFees: takerPathObj.maxFees,
      takerPath: takerPathObj.path
    }
  }

  public async prepCancelOrder (
    signedOrder: SignedOrder,
    cancelTakerTokenValue: number | string,
    options: ExchangeOptions = {}
  ): Promise<TxObject> {
    const {
      exchangeContractAddress,
      takerTokenAddress
    } = signedOrder
    const {
      gasLimit,
      gasPrice,
      takerTokenDecimals
    } = options
    const [ takerDecimals, orderWithFees ] = await Promise.all([
      this._currencyNetwork.getDecimals(takerTokenAddress, takerTokenDecimals),
      this._getFees(signedOrder)
    ])
    const orderAddresses = this._getOrderAddresses(orderWithFees)
    const orderValues = this._getOrderValues(orderWithFees)
    const { rawTx, ethFees } = await this._transaction.prepFuncTx(
      this._user.address,
      exchangeContractAddress,
      'Exchange',
      'cancelOrder',
      [
        orderAddresses,
        orderValues,
        this._utils.calcRaw(cancelTakerTokenValue, takerDecimals)
      ], {
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined
      }
    )
    return {
      rawTx,
      ethFees
    }
  }

  public async confirm (rawTx: string): Promise<string> {
    const signedTx = await this._user.signTx(rawTx)
    return this._transaction.relayTx(signedTx)
  }

  private async _getPathObj (
    tokenAddress: string,
    from: string,
    to: string,
    value: number | string,
    options: TLOptions
  ): Promise<PathObject> {
    const { decimals } = options
    const isNetwork = await this._currencyNetwork.isNetwork(tokenAddress)
    if (isNetwork) {
      return this._payment.getPath(
        tokenAddress,
        from,
        to,
        value,
        { decimals }
      )
    }
    return {
      path: [],
      maxFees: this._utils.formatAmount(0, decimals),
      estimatedGas: new BigNumber(40000),
      isNetwork: false
    }
  }

  private _getOrderAddresses (order: Order): Array<string> {
    return [
      order.maker,
      ZERO_ADDRESS,
      order.makerTokenAddress,
      order.takerTokenAddress,
      order.feeRecipient
    ]
  }

  private _getOrderValues (order: Order): string[] {
    return [
      order.makerTokenAmount.raw,
      order.takerTokenAmount.raw,
      '0', // NOTE fees disabled
      '0', // NOTE fees disabled
      order.expirationUnixTimestampSec,
      order.salt
    ]
  }

  private _getPartialAmount (
    numerator: number | string,
    denominator: number | string,
    target: number | string
  ): number {
    const bnNumerator = new BigNumber(numerator)
    const bnDenominator = new BigNumber(denominator)
    const bnTarget = new BigNumber(target)
    return bnNumerator.times(bnTarget).dividedBy(bnDenominator).toNumber()
  }

  private _getFees (order: Order): Promise<Order> {
    // NOTE: Fees are disabled for now
    return Promise.resolve({
      ...order,
      feeRecipient: ZERO_ADDRESS,
      makerFee: this._utils.formatAmount(0, 2),
      takerFee: this._utils.formatAmount(0, 2)
    })
  }

  private _postRequest (path: string, payload: any): Promise<any> {
    return this._utils.fetchUrl(path, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
  }

  private _getOrderHashHex (order: any): string {
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
        value: new BigNumber(order.makerTokenAmount.raw, 10).toNumber(),
        type: 'uint256'
      },
      {
        value: new BigNumber(order.takerTokenAmount.raw, 10).toNumber(),
        type: 'uint256'
      },
      {
        value: new BigNumber(order.makerFee.raw, 10).toNumber(),
        type: 'uint256'
      },
      {
        value: new BigNumber(order.takerFee.raw, 10).toNumber(),
        type: 'uint256'
      },
      {
        value: new BigNumber(order.expirationUnixTimestampSec, 10).toNumber(),
        type: 'uint256'
      },
      {
        value: new BigNumber(order.salt, 10).toNumber(),
        type: 'uint256'
      }
    ]
    const types = orderParts.map(part => part.type)
    const values = orderParts.map(part => part.value)
    const hashBuff = ethABI.soliditySHA3(types, values)
    return ethUtils.bufferToHex(hashBuff)
  }
}
