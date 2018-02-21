import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'

import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'

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
      // salt: Math.floor(Math.random() * 1000000000000000),
      salt: 1,
      taker: '0x0000000000000000000000000000000000000000',
      takerTokenAddress,
      takerTokenAmount
    }
    const keysOrder = [
      'exchangeContractAddress',
      'maker',
      'taker',
      'makerTokenAddress',
      'takerTokenAddress',
      'feeRecipient',
      'makerTokenAmount',
      'takerTokenAmount',
      'makerFee',
      'takerFee',
      'expirationUnixTimestampSec',
      'salt'
    ]
    return this.getFees(feesRequest)
      .then(({ feeRecipient, makerFee, takerFee }) => ({
        ...feesRequest, feeRecipient, makerFee, takerFee
      }))
      .then(order => this.user.signMsg(this.padToDataString(order, keysOrder)).then(
        ({ ecSignature }) => ({...order, ecSignature})
      ))
      .then(signedOrder => {
        console.log(signedOrder)
        this.postRequest('exchange/order', signedOrder)
      })
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

  private padToDataString (obj: any, params: string[]): string {
    return params.reduce((dataString, param) => {
      const value = obj[param]
      if (ethUtils.isValidAddress(value)) {
        dataString += value.substr(2, value.length - 1).toLowerCase()
      } else {
        const pad = '00000000000000000000000000000000000000000000000000000000000000000'
        const hexValue = Number(value).toString(16)
        dataString += (pad.substring(0, pad.length - hexValue.length) + hexValue)
      }
      return dataString
    }, '')
  }
}
