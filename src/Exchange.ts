import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'

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
    private currencyNetwork: CurrencyNetwork
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

  public makeOrder (
    exchangeContractAddress: string,
    makerTokenAddress: string,
    takerTokenAddress: string,
    makerTokenAmount: any,
    takerTokenAmount: any,
    { expirationUnixTimestampSec = 2524604400 } = {}
  ): Promise<any> {
    const feesRequest = {
      exchangeContractAddress,
      expirationUnixTimestampSec,
      maker: this.user.address,
      makerTokenAddress,
      makerTokenAmount,
      salt: Math.floor(Math.random() * 1000000000000000),
      taker: ZERO_ADDRESS,
      takerTokenAddress,
      takerTokenAmount
    }
    return this.getFees(feesRequest)
      .then(({ feeRecipient, makerFee, takerFee }) => ({
        ...feesRequest, feeRecipient, makerFee, takerFee
      }))
      .then(order => this.user.signMsg(this.getOrderHashHex(order)).then(
        ({ ecSignature }) => ({...order, ecSignature})
      ))
      .then(signedOrder => this.postRequest('exchange/order', signedOrder))
  }

  private getFees (request: any): Promise<any> {
    const convertedRequest = this.convertFieldsToBigNumber(request, [
      'expirationUnixTimestampSec', 'makerTokenAmount', 'salt', 'takerTokenAmount'
    ])
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
