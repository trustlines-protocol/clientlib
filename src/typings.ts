import { BigNumber } from 'bignumber.js'

/**
 * GENERAL
 */
export interface TLNetworkConfig {
  protocol?: string,
  host?: string,
  port?: number,
  path?: string,
  pollInterval?: number,
  useWebSockets?: boolean,
  wsProtocol?: string
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

export interface Amount {
  raw: string,
  value: string,
  decimals: number
}

/**
 * EVENTS
 */

export interface EventFilterOptions {
  type?: string,
  fromBlock?: number,
  toBlock?: number
}

export interface TLEvent {
  networkAddress: string,
  type: string,
  timestamp: number,
  blockNumber: number,
  status: string,
  transactionId: string,
  from: string,
  to: string,
  direction: string,
  address?: string,
  // only on TrustlineUpdateRequest and TrustlineUpdate
  given?: Amount,
  received?: Amount,
  // only on Transfer
  amount?: Amount
}

/**
 * TRANSACTION
 */
export interface TxObject {
  rawTx: string,
  ethFees: Amount
}

export interface TxInfos {
  gasPrice: number,
  balance: number,
  nonce: number
}

/**
 * CURRENCY NETWORK
 */
export interface Network {
  name: string,
  abbreviation: string,
  address: string
}

export interface NetworkDetails extends Network {
  decimals: number,
  numUsers: number
}

export interface UserOverview {
  leftReceived: Amount,
  balance: Amount,
  given: Amount,
  received: Amount,
  leftGiven: Amount
}

export interface UserOverviewUnformatted {
  leftReceived: string,
  balance: string,
  given: string,
  received: string,
  leftGiven: string
}

/**
 * USER
 */
export interface UserObject {
  address: string,
  pubKey: string,
  keystore: string
}

/**
 * TRUSTLINE
 */
export interface TrustlineObject {
  id: string,
  address: string,
  balance: Amount,
  given: Amount,
  received: Amount,
  leftGiven: Amount,
  leftReceived: Amount
}

export interface TrustlineUnformatted {
  id: string,
  address: string,
  balance: string,
  given: string,
  received: string,
  leftGiven: string,
  leftReceived: string
}

/**
 * EXCHANGE
 */
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

export interface ExchangeOptions extends TxOptions {
  makerTokenDecimals?: number,
  takerTokenDecimals?: number,
  expirationUnixTimestampSec?: number
}

export interface OrderbookOptions {
  baseTokenDecimals?: number,
  quoteTokenDecimals?: number
}
