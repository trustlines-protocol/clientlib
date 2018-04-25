import { BigNumber } from 'bignumber.js'

/**
 * Configuration object for a TLNetwork instance
 */
export interface TLNetworkConfig {
  /**
   * Protocol for communicating with a relay server
   */
  protocol?: string,
  /**
   * Host of a relay server
   */
  host?: string,
  /**
   * Port for communcation
   */
  port?: number,
  /**
   * Base path for the relay api
   */
  path?: string,
  /**
   * Protocol for websockets
   */
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

// EVENTS
export interface EventFilterOptions {
  type?: string,
  fromBlock?: number
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

// TRANSACTION
export interface TxObject {
  rawTx: string,
  ethFees: Amount
}

/**
 * Information for creating an ethereum transaction of a given user address
 * as returned by the relay server.
 */
export interface TxInfos {
  /**
   * Amount of ETH in gwei for every unit of gas user is willing to pay
   */
  gasPrice: number,
  /**
   * Balance of given user address in ETH
   */
  balance: number,
  /**
   * Transaction count of given user address
   */
  nonce: number
}

// PAYMENT
export interface TLTxObject extends TxObject {
  path: string[],
  maxFees: Amount
}

export interface PathObject {
  path: string[],
  maxFees: Amount,
  estimatedGas: number,
  isNetwork?: boolean
}

export interface PathRaw {
  path: string[],
  fees: string,
  estimatedGas: number
}

// CURRENCY NETWORK
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

export interface UserOverviewRaw {
  leftReceived: string,
  balance: string,
  given: string,
  received: string,
  leftGiven: string
}

// USER
export interface UserObject {
  address: string,
  pubKey: string,
  keystore: string
}

export interface Signature {
  ecSignature: ECSignature,
  concatSig: string
}

// TRUSTLINE
export interface TrustlineObject {
  id: string,
  address: string,
  balance: Amount,
  given: Amount,
  received: Amount,
  leftGiven: Amount,
  leftReceived: Amount
}

export interface TrustlineRaw {
  id: string,
  address: string,
  balance: string,
  given: string,
  received: string,
  leftGiven: string,
  leftReceived: string
}

// EXCHANGE
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
  hash?: string
}

/**
 * Order object as returned by relay
 */
export interface OrderRaw {
  maker: string // this.user.address
  taker: string // optional
  makerFee: string
  takerFee: string
  makerTokenAmount: string // required
  takerTokenAmount: string // required
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

export interface OrderbookRaw {
  asks: OrderRaw[],
  bids: OrderRaw[]
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

export interface ExchangeTx extends TxObject {
  makerMaxFees: Amount,
  makerPath: string[],
  takerMaxFees: Amount,
  takerPath: string[]
}

export interface OrderOptions {
  includeFilled?: boolean,
  includeCancelled?: boolean,
  includeUnavailable?: boolean,
  makerTokenDecimals?: number,
  takerTokenDecimals?: number
}
