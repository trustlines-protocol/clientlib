import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import { Payment } from './Payment'
import { ExchangeOptions } from './typings'

import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'
import * as ethABI from 'ethereumjs-abi'
import BN = require('bn.js')

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export class Exchange {

  constructor (
    private event: Event,
    private user: User,
    private utils: Utils,
    private transaction: Transaction,
    private currencyNetwork: CurrencyNetwork,
    private payment: Payment
  ) {}

  public getExchanges (): Promise<any> {
    return this.utils.fetchUrl('exchange/exchanges')
  }

  public getOrderbook (
    baseTokenAddress: string,
    quoteTokenAddress: string
  ): Promise<any> {
    const params = { baseTokenAddress, quoteTokenAddress }
    const endpoint = this.utils.buildUrl('exchange/orderbook', params)
    return this.utils.fetchUrl(endpoint)
    // TODO format amount of bids and asks
  }

  public async makeOrder (
    exchangeContractAddress: string,
    makerTokenAddress: string,
    takerTokenAddress: string,
    makerTokenValue: number | string,
    takerTokenValue: number | string,
    {
      makerTokenDecimals,
      takerTokenDecimals,
      expirationUnixTimestampSec = 2524604400
    }: ExchangeOptions = {}
  ): Promise<any> {
    const { currencyNetwork, user, utils } = this
    try {
      const makerDecimals = await currencyNetwork.getDecimals(makerTokenAddress, makerTokenDecimals)
      const takerDecimals = await currencyNetwork.getDecimals(takerTokenAddress, takerTokenDecimals)
      const feesRequest = {
        exchangeContractAddress,
        expirationUnixTimestampSec: expirationUnixTimestampSec.toString(),
        maker: user.address,
        makerTokenAddress,
        makerTokenAmount: utils.calcRaw(makerTokenValue, makerDecimals).toString(),
        salt: Math.floor(Math.random() * 1000000000000000).toString(),
        taker: ZERO_ADDRESS,
        takerTokenAddress,
        takerTokenAmount: utils.calcRaw(takerTokenValue, takerDecimals).toString()
      }
      const { feeRecipient, makerFee, takerFee } = await this.getFees(feesRequest)
      const order = {
        ...feesRequest,
        makerFee,
        takerFee,
        feeRecipient
      }
      return user.signMsg(this.getOrderHashHex(order))
        .then(({ ecSignature }) => ({...order, ecSignature}))
        .then(signedOrder => this.postRequest('exchange/order', signedOrder))
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Prepares an on-chain transaction for a fill order.
   * @param orderAddresses Array of order's maker, taker, makerToken, takerToken, and feeRecipient.
   * @param orderValues Array of order's makerTokenAmount, takerTokenAmount, makerFee, takerFee, expirationTimestampInSec, and salt.
   * @param fillTakerTokenAmount Desired amount of takerToken to fill.
   * @param makerPath Path in the currency network of the maker token or [] if no currency network
   * @param takerPath Path in the currency network of the taker token or [] if no currency network
   * @param v ECDSA signature parameter v.
   * @param r ECDSA signature parameter r.
   * @param s ECDSA signature parameter s.
   */
  public async prepTakeOrder (
    exchangeContractAddress: string,
    makerAddress: string,
    makerTokenAddress: string,
    takerTokenAddress: string,
    makerTokenValue: number | string,
    takerTokenValue: number | string,
    fillTakerTokenValue: number | string,
    salt: string,
    expirationUnixTimestampSec: string,
    v: number,
    r: string,
    s: string,
    {
      gasLimit,
      gasPrice,
      makerTokenDecimals,
      takerTokenDecimals
    }: ExchangeOptions = {}
  ): Promise<any> {
    const { currencyNetwork, payment, transaction, user, utils } = this

    try {
      const makerDecimals = await currencyNetwork.getDecimals(makerTokenAddress, makerTokenDecimals)
      const takerDecimals = await currencyNetwork.getDecimals(takerTokenAddress, takerTokenDecimals)
      const feesRequest = {
        exchangeContractAddress,
        expirationUnixTimestampSec,
        maker: makerAddress,
        makerTokenAddress,
        makerTokenAmount: utils.calcRaw(makerTokenValue, makerDecimals),
        salt,
        taker: ZERO_ADDRESS,
        takerTokenAddress,
        takerTokenAmount: utils.calcRaw(takerTokenValue, takerDecimals)
      }
      const { feeRecipient, makerFee, takerFee } = await this.getFees(feesRequest)
      const makerPath = currencyNetwork.isNetwork(takerTokenAddress)
        ? await payment.getPath(
          makerTokenAddress,
          makerAddress,
          user.address,
          this.getPartialAmount(fillTakerTokenValue, takerTokenValue, makerTokenValue),
          { decimals: makerTokenDecimals }
        ) : []
      const takerPath = currencyNetwork.isNetwork(takerTokenAddress)
        ? await payment.getPath(
          takerTokenAddress,
          user.address,
          makerAddress,
          fillTakerTokenValue,
          { decimals: takerTokenDecimals }
        ) : []
      const orderAddresses = [
        makerAddress,
        ZERO_ADDRESS,
        makerTokenAddress,
        takerTokenAddress,
        feeRecipient
      ]
      const orderValues = [
        utils.calcRaw(makerTokenValue, makerDecimals),
        utils.calcRaw(takerTokenValue, takerDecimals),
        parseInt(makerFee, 10),
        parseInt(takerFee, 10),
        parseInt(expirationUnixTimestampSec, 10),
        parseInt(salt, 10)
      ]

      if (makerPath.path.length === 0 || takerPath.path.length === 0) {
        return Promise.reject('Could not find a path with enough capacity')
      }
      return transaction.prepFuncTx(
        user.address,
        exchangeContractAddress,
        'Exchange',
        'fillOrderTrustlines',
        [
          orderAddresses,
          orderValues,
          utils.calcRaw(fillTakerTokenValue, takerDecimals),
          makerPath.path,
          takerPath.path,
          v,
          ethUtils.toBuffer(r),
          ethUtils.toBuffer(s)
        ]
      )
    } catch (error) {
      return Promise.reject(error)
    }
  }

  private getPartialAmount (
    numerator: number | string,
    denominator: number | string,
    target: number | string
  ): number {
    const bnNumerator = new BigNumber(numerator)
    const bnDenominator = new BigNumber(denominator)
    const bnTarget = new BigNumber(target)
    return bnNumerator.times(bnTarget).dividedBy(bnDenominator).toNumber()
  }

  private getFees (request: any): Promise<any> {
    // const convertedRequest = this.convertFieldsToBigNumber(request, [
    //   'expirationUnixTimestampSec', 'makerTokenAmount', 'salt', 'takerTokenAmount'
    // ])
    // NOTE fees disabled
    // return this.postRequest('/exchange/fees', convertedRequest)
    return Promise.resolve({
      feeRecipient: ZERO_ADDRESS,
      makerFee: new BigNumber(0).toString(),
      takerFee: new BigNumber(0).toString()
    })
  }

  private postRequest (path: string, payload: any): Promise<any> {
    return this.utils.fetchUrl(path, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
  }

  private convertFieldsToBigNumber (obj: any, fields: string[]): any {
    fields.forEach(key => {
      if (obj[key]) {
        obj[key] = new BigNumber(obj[key]).toString()
      }
    })
    return obj
  }

  private getOrderHashHex (order: any): string {
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
        value: new BN(order.makerTokenAmount, 10),
        type: 'uint256'
      },
      {
        value: new BN(order.takerTokenAmount, 10),
        type: 'uint256'
      },
      {
        value: new BN(order.makerFee, 10),
        type: 'uint256'
      },
      {
        value: new BN(order.takerFee, 10),
        type: 'uint256'
      },
      {
        value: new BN(order.expirationUnixTimestampSec, 10),
        type: 'uint256'
      },
      {
        value: new BN(order.salt, 10),
        type: 'uint256'
      }
    ]
    const types = orderParts.map(part => part.type)
    const values = orderParts.map(part => part.value)
    const hashBuff = ethABI.soliditySHA3(types, values)
    return ethUtils.bufferToHex(hashBuff)
  }
}
