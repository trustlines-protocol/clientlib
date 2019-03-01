import { BigNumber } from 'bignumber.js'

/**
 * Configuration object for a TLNetwork instance
 */
export interface TLNetworkConfig {
  /**
   * Protocol for communicating with a relay server
   */
  protocol?: string
  /**
   * Host of a relay server
   */
  host?: string
  /**
   * Port for communication
   */
  port?: number
  /**
   * Base path for the relay api
   */
  path?: string
  /**
   * Protocol for WebSockets
   */
  wsProtocol?: string
  /**
   * Web3 provider
   */
  web3Provider?: any
  /**
   * Full URL for relay rest api
   */
  relayApiUrl?: string
  /**
   * Full URL for relay WebSocket api
   */
  relayWsApiUrl?: string
}

/**
 * For internal use of `prepFuncTx` and `prepValueTx`.
 */
export interface TxOptionsInternal {
  value?: BigNumber
  gasPrice?: BigNumber
  gasLimit?: BigNumber
}

export interface TxOptions {
  value?: string
  gasPrice?: string
  gasLimit?: string
}

export type TLOptions = TxOptions & DecimalsOptions

export interface PaymentOptions extends TLOptions {
  maximumHops?: number
  maximumFees?: number
  feePayer?: FeePayer
}

export interface TrustlineUpdateOptions extends TLOptions {
  interestRateGiven?: number
  interestRateReceived?: number
}

export interface AmountInternal {
  raw: BigNumber
  value: BigNumber
  decimals: number
}

export interface Amount {
  raw: string
  value: string
  decimals: number
}

// EVENTS
export interface EventFilterOptions {
  type?: string
  fromBlock?: number
}

export interface BlockchainEvent {
  type: string
  timestamp: number
  blockNumber: number
  status: string
  transactionId: string
}

export interface TLEvent extends BlockchainEvent {
  from: string
  to: string
  direction: string
  counterParty: string
  user: string
}

export interface NetworkEvent extends TLEvent {
  networkAddress: string
}

export interface NetworkTransferEventRaw extends NetworkEvent {
  amount: string
}

export interface NetworkTransferEvent extends NetworkEvent {
  amount: Amount
}

export interface NetworkTrustlineEventRaw extends NetworkEvent {
  given: string
  received: string
  interestRateGiven: string
  interestRateReceived: string
}

export interface NetworkTrustlineEvent extends NetworkEvent {
  given: Amount
  received: Amount
  interestRateGiven: Amount
  interestRateReceived: Amount
}

export type AnyNetworkEvent = NetworkTransferEvent | NetworkTrustlineEvent
export type AnyNetworkEventRaw =
  | NetworkTransferEventRaw
  | NetworkTrustlineEventRaw

export interface TokenEvent extends TLEvent {
  tokenAddress: string
}

export interface TokenAmountEventRaw extends TokenEvent {
  amount: string
}

export interface TokenAmountEvent extends TokenEvent {
  amount: Amount
}

export type AnyTokenEvent = TokenAmountEvent
export type AnyTokenEventRaw = TokenAmountEventRaw

export interface ExchangeEvent extends TLEvent {
  exchangeAddress: string
  makerTokenAddress: string
  takerTokenAddress: string
  orderHash: string
}

export interface ExchangeFillEventRaw extends ExchangeEvent {
  filledMakerAmount: string
  filledTakerAmount: string
}

export interface ExchangeFillEvent extends ExchangeEvent {
  filledMakerAmount: Amount
  filledTakerAmount: Amount
}

export interface ExchangeCancelEventRaw extends ExchangeEvent {
  cancelledMakerAmount: string
  cancelledTakerAmount: string
}

export interface ExchangeCancelEvent extends ExchangeEvent {
  cancelledMakerAmount: Amount
  cancelledTakerAmount: Amount
}

export type AnyExchangeEvent = ExchangeFillEvent | ExchangeCancelEvent
export type AnyExchangeEventRaw = ExchangeFillEventRaw | ExchangeCancelEventRaw

export type AnyEvent = AnyNetworkEvent | AnyTokenEvent | AnyExchangeEvent
export type AnyEventRaw =
  | AnyNetworkEventRaw
  | AnyTokenEventRaw
  | AnyExchangeEventRaw
export type AmountEventRaw = NetworkTransferEventRaw | TokenAmountEventRaw

// TRANSACTION
export interface TxObject {
  rawTx: RawTxObject
  ethFees: Amount
}

export interface TxObjectInternal {
  rawTx: RawTxObject
  ethFees: AmountInternal
}

export interface RawTxObject {
  from: string
  to?: string
  value?: number | string | BigNumber
  gasLimit?: number | string | BigNumber
  gasPrice?: number | string | BigNumber
  data?: string
  nonce?: number
}

export interface Web3TxReceipt {
  status: boolean
  blockHash: string
  blockNumber: number
  transactionHash: string
  transactionIndex: number
  from: string
  to: string
  contractAddress: string
  cumulativeGasUsed: number
  gasUsed: number
  logs: Web3Log[]
}

export interface Web3Log {
  address: string
  data: string
  topics: string[]
  logIndex: number
  transactionIndex: number
  transactionHash: string
  blockHash: string
  blockNumber: number
}

/**
 * Information for creating an ethereum transaction of a given user address
 * as returned by the relay server.
 */
export interface TxInfosRaw {
  /**
   * Amount of ETH in gwei for every unit of gas user is willing to pay
   */
  gasPrice: string
  /**
   * Balance of given user address in ETH
   */
  balance: string
  /**
   * Transaction count of given user address
   */
  nonce: number
}

export interface TxInfos {
  /**
   * Amount of ETH in gwei for every unit of gas user is willing to pay
   */
  gasPrice: BigNumber
  /**
   * Balance of given user address in ETH
   */
  balance: BigNumber
  /**
   * Transaction count of given user address
   */
  nonce: number
}

// PAYMENT
export interface PaymentTxObject extends TxObject {
  path: string[]
  maxFees: Amount
}

export enum FeePayer {
  Sender = 'sender',
  Receiver = 'receiver'
}

export interface PathObject {
  path: string[]
  feePayer: FeePayer
  maxFees: Amount
  estimatedGas: BigNumber
  isNetwork?: boolean
}

export interface PathRaw {
  path: string[]
  feePayer: string
  fees: string
  estimatedGas: number
}

// CURRENCY NETWORK
export interface Network {
  name: string
  abbreviation: string
  address: string
}

export interface NetworkDetails extends Network {
  decimals: number
  numUsers: number
  defaultInterestRate: Amount
  interestRateDecimals: number
  customInterests: boolean
  preventMediatorInterests: boolean
}

export interface NetworkDetailsRaw extends Network {
  decimals: number
  numUsers: number
  defaultInterestRate: string
  interestRateDecimals: number
  customInterests: boolean
  preventMediatorInterests: boolean
}

export interface UserOverview {
  balance: Amount
  given: Amount
  received: Amount
  leftGiven: Amount
  leftReceived: Amount
}

export interface UserOverviewRaw {
  leftReceived: string
  balance: string
  given: string
  received: string
  leftGiven: string
}

export interface DecimalsOptions {
  networkDecimals?: number
  interestRateDecimals?: number
}

export interface DecimalsObject {
  networkDecimals: number
  interestRateDecimals: number
}

// USER
export interface UserObject {
  address: string
  pubKey: string
  keystore: string
}

export interface Signature {
  ecSignature: ECSignature
  concatSig: string
}

// TRUSTLINE
export interface TrustlineObject {
  id: string
  address: string
  balance: Amount
  given: Amount
  received: Amount
  leftGiven: Amount
  leftReceived: Amount
  interestRateGiven: Amount
  interestRateReceived: Amount
}

export interface TrustlineRaw {
  id: string
  address: string
  balance: string
  given: string
  received: string
  leftGiven: string
  leftReceived: string
  interestRateGiven: string
  interestRateReceived: string
}

/**
 * Path object for closing a trustline.
 * Contains all relevant information for closing a trustline.
 */
export interface ClosePathObject {
  /**
   * Close path for triangulation
   */
  path: string[]
  /**
   * Maximal fees that can occur for closing
   */
  maxFees: Amount
  /**
   * Estimated gas costs for closing
   */
  estimatedGas: BigNumber
  /**
   * Estimated value to be transferred for closing
   */
  value: Amount
}

export interface ClosePathRaw {
  path: string[]
  fees: string
  estimatedGas: number
  value: string
}

export type CloseTxObject = PaymentTxObject

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
  hash: string
  filledMakerTokenAmount: Amount
  filledTakerTokenAmount: Amount
  cancelledMakerTokenAmount: Amount
  cancelledTakerTokenAmount: Amount
  availableMakerTokenAmount: Amount
  availableTakerTokenAmount: Amount
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
  filledMakerTokenAmount: string
  filledTakerTokenAmount: string
  cancelledMakerTokenAmount: string
  cancelledTakerTokenAmount: string
  availableMakerTokenAmount: string
  availableTakerTokenAmount: string
}

export interface Orderbook {
  asks: SignedOrder[]
  bids: SignedOrder[]
}

export interface OrderbookRaw {
  asks: SignedOrderRaw[]
  bids: SignedOrderRaw[]
}

export interface SignedOrder extends Order {
  ecSignature: ECSignature
}

export interface SignedOrderRaw extends OrderRaw {
  ecSignature: ECSignature
}

export interface ECSignature {
  v: number
  r: string
  s: string
}

export type AnyOrder = Order | OrderRaw | SignedOrder | SignedOrderRaw

export interface FeesRequest {
  exchangeContractAddress: string
  expirationUnixTimestampSec: BigNumber
  maker: string
  makerTokenAddress: string
  makerTokenAmount: BigNumber
  salt: BigNumber
  taker: string
  takerTokenAddress: string
  takerTokenAmount: BigNumber
}

export interface FeesResponse {
  feeRecipient: string
  makerFee: BigNumber
  takerFee: BigNumber
}

export interface ExchangeOptions {
  makerTokenDecimals?: number
  takerTokenDecimals?: number
  expirationUnixTimestampSec?: number
}

export type ExchangeTxOptions = TxOptions & ExchangeOptions

export interface OrderbookOptions {
  baseTokenDecimals?: number
  quoteTokenDecimals?: number
}

export interface ExchangeTx extends TxObject {
  makerMaxFees: Amount
  makerPath: string[]
  takerMaxFees: Amount
  takerPath: string[]
}

export interface OrderOptions {
  makerTokenDecimals?: number
  takerTokenDecimals?: number
}

export interface OrdersQuery {
  exchangeContractAddress?: string
  tokenAddress?: string
  makerTokenAddress?: string
  takerTokenAddress?: string
  trader?: string
  maker?: string
  taker?: string
  feeRecipient?: string
}
