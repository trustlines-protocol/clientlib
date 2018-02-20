import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'

import { BigNumber } from 'bignumber.js'

export class Exchange {

  // TODO either fetch from server or from whitelist in clientlib
  private exchangeContractAddress = '0x'

  constructor (
    private event: Event,
    private user: User,
    private utils: Utils,
    private transaction: Transaction,
    private currencyNetwork: CurrencyNetwork
  ) {}

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
      taker: '0x0000000000000000000000000000000000000000',
      takerTokenAddress,
      takerTokenAmount
    }
    return this.getFees(feesRequest)
      .then(({ feeRecipient, makerFee, takerFee }) => ({
        ...feesRequest, feeRecipient, makerFee, takerFee
      }))
      .then(order => this.user.signMsg(JSON.stringify(order)).then(
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
      feeRecipient: '0x0000000000000000000000000000000000000000',
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
}
