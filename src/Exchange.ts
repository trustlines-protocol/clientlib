import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'

import { BigNumber } from 'bignumber.js'

export interface Order {
  maker: string // this.user.address
  taker: string // optional
  makerFee: BigNumber
  takerFee: BigNumber
  makerTokenAmount: BigNumber // required
  takerTokenAmount: BigNumber // required
  makerTokenAddress: string // required
  takerTokenAddress: string // required
  salt: BigNumber
  exchangeContractAddress: string
  feeRecipient: string
  expirationUnixTimestampSec: BigNumber
}

export interface SignedOrder extends Order {
  ecSignature: ECSignature
}

export interface ECSignature {
  v: number
  r: string
  s: string
}

export interface FeesRequest {
	 exchangeContractAddress: string,
	 expirationUnixTimestampSec: BigNumber,
	 maker: string,
	 makerTokenAddress: string,
	 makerTokenAmount: BigNumber,
	 salt: BigNumber,
	 taker: string,
	 takerTokenAddress: string,
	 takerTokenAmount: BigNumber,
}

export interface FeesResponse {
	 feeRecipient: string,
	 makerFee: BigNumber,
	 takerFee: BigNumber,
}

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

  public makeOrder (
    makerTokenAmount: any,
    takerTokenAmount: any,
    makerTokenAddress: string,
    takerTokenAddress: string,
    { taker = '', expirationUnixTimestampSec = 2524604400 } = {}
  ): Promise<any> {
    const feesRequest = {
      exchangeContractAddress: this.exchangeContractAddress,
      expirationUnixTimestampSec,
      maker: this.user.address.toLowerCase(),
      makerTokenAddress,
      makerTokenAmount,
      salt: Math.floor(Math.random() * 1000000000000000),
      taker,
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
      .then(signedOrder => console.log(signedOrder))
  }

  private getFees (request: any): Promise<any> {
    const convertedRequest = this.convertFieldsToBigNumber(request, [
      'expirationUnixTimestampSec', 'makerTokenAmount', 'salt', 'takerTokenAmount'
    ])
    // return this.postRequest('/exchange/fees', convertedRequest)
    return Promise.resolve({
      feeRecipient: '0x...',
      makerFee: '10000',
      takerFee: '20000'
    })
  }

  private postRequest (path: string, payload: any): Promise<any> {
    return this.utils.fetchUrl(path, {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ payload })
    })
  }

  private convertFieldsToBigNumber (obj: any, fields: string[]): any {
    for (let key in Object.keys(obj)) {
      if (fields.indexOf(key) !== -1) {
        obj[key] = new BigNumber(obj[key])
      }
    }
    return obj
  }
}
