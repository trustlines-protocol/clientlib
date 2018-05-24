import { BigNumber } from 'bignumber.js'

export interface TLNetworkConfig {
  protocol?: string,
  host?: string,
  port?: number,
  path?: string,
  pollInterval?: number,
  useWebSockets?: boolean,
  wsProtocol?: string
}

export interface TxObject {
  rawTx: string,
  ethFees: Amount
}

export interface TxInfos {
  gasPrice: number,
  balance: number,
  nonce: number
}

export interface Amount {
  raw: string | number,
  value: string | number,
  decimals: number
}

export interface EventFilterOptions {
  type?: string,
  fromBlock?: number,
  toBlock?: number
}

export interface Order {
  maker: string // this.user.address
  taker: string // optional
  makerFee: Amount
  takerFee: Amount
  makerTokenAmount: Amount // required
  takerTokenAmount: Amount // required
  makerTokenAddress: string // required
  takerTokenAddress: string // required
  salt: string
  exchangeContractAddress: string
  feeRecipient: string
  expirationUnixTimestampSec: string
}

export interface Orderbook {
  asks: Order[],
  bids: Order[]
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
  takerFee: BigNumber
}

export interface TxOptions {
  gasPrice?: number,
  gasLimit?: number
}

export interface TLOptions extends TxOptions {
  decimals?: number
}

export interface PaymentOptions extends TLOptions {
  maximumHops?: number,
  maximumFees?: number
}

export interface ExchangeOptions extends TxOptions {
  makerTokenDecimals?: number,
  takerTokenDecimals?: number,
  expirationUnixTimestampSec?: number
}

export interface OrderbookOptions {
  baseTokenDecimals?: number,
  quoteTokenDecimals?: number
}
