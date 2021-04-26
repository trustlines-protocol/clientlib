import { BigNumber } from 'bignumber.js'
import { Options as ReconnectingOptions } from 'reconnecting-websocket'

/**
 * Configuration object for a TLNetwork instance
 */
export interface TLNetworkConfig {
  /**
   * ProviderUrl object or full url for the relay api
   */
  relayUrl?: string | ProviderUrl
  /**
   * ProviderUrl object or full url for the messaging api
   */
  messagingUrl?: string | ProviderUrl
  /**
   * Web3 provider
   */
  web3Provider?: any
  /**
   * Full URL for trustline rest api
   */
  walletType?: string
  /**
   * Address of the identity factory
   */
  identityFactoryAddress?: string
  /**
   * Address of the implementation of the identity contract
   */
  identityImplementationAddress?: string
  /**
   * Chain id used in the signature of meta-tx
   */
  chainId?: number
  /**
   * Mechanism how to generate nonces for identity meta-tx
   */
  nonceMechanism?: NonceMechanism
}

export interface ProviderUrl {
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
  port?: number | string
  /**
   * Base path for the relay api
   */
  path?: string
}

/**
 * For internal use of `prepareContractTransaction` and `prepareValueTransaction`.
 */
export interface TxOptionsInternal {
  value?: BigNumber
  baseFee?: number | string | BigNumber
  gasPrice?: number | string | BigNumber
  gasLimit?: BigNumber
  currencyNetworkOfFees?: string
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
  extraData?: string
  paymentRequestId?: string
  addTransferId?: boolean
  remainingData?: string
}

export interface TrustlineUpdateOptions extends TLOptions {
  interestRateGiven?: number
  interestRateReceived?: number
  isFrozen?: boolean
  transfer?: number | string
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
  contractType?: 'CurrencyNetwork' | 'Exchange' | 'UnwETH' | 'Token'
  fromBlock?: number
}

export interface BlockchainEvent {
  type: string
  timestamp: number
  blockNumber: number
  status: string
  transactionHash: string
  blockHash: string
  logIndex: number
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
  extraData: string
}

export interface NetworkTransferEvent extends NetworkEvent {
  amount: Amount
  extraData: string
  paymentRequestId: string
  transferId: string
  remainingData: string
}

export interface NetworkTrustlineUpdateEventRaw extends NetworkEvent {
  given: string
  received: string
  interestRateGiven: string
  interestRateReceived: string
  isFrozen: boolean
}

export interface NetworkTrustlineUpdateRequestEventRaw
  extends NetworkTrustlineUpdateEventRaw {
  transfer: string
}

export interface NetworkTrustlineUpdateEvent extends NetworkEvent {
  given: Amount
  received: Amount
  interestRateGiven: Amount
  interestRateReceived: Amount
  isFrozen: boolean
}

export interface NetworkTrustlineUpdateRequestEvent
  extends NetworkTrustlineUpdateEvent {
  transfer: Amount
}

export type NetworkTrustlineCancelEventRaw = NetworkEvent
export type NetworkTrustlineCancelEvent = NetworkEvent

export interface NetworkTrustlineBalanceUpdateRaw extends NetworkEvent {
  amount: string
}
export interface NetworkTrustlineBalanceUpdate extends NetworkEvent {
  amount: Amount
}

export type AnyNetworkEvent =
  | NetworkTransferEvent
  | NetworkTrustlineUpdateEvent
  | NetworkTrustlineCancelEvent
  | NetworkTrustlineUpdateRequestEvent
export type AnyNetworkEventRaw =
  | NetworkTransferEventRaw
  | NetworkTrustlineUpdateEventRaw
  | NetworkTrustlineCancelEventRaw
  | NetworkTrustlineUpdateRequestEventRaw

export type AnyNetworkTrustlineEventRaw =
  | NetworkTrustlineUpdateEventRaw
  | NetworkTrustlineCancelEventRaw
  | NetworkTrustlineBalanceUpdateRaw
  | NetworkTrustlineUpdateRequestEventRaw

export type AnyNetworkTrustlineEvent =
  | NetworkTrustlineUpdateEvent
  | NetworkTrustlineCancelEvent
  | NetworkTrustlineBalanceUpdate
  | NetworkTrustlineUpdateRequestEvent

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

interface Message {
  type: string
  from: string
  to: string
  direction: Direction
}

export interface PaymentRequestMessage extends Message {
  networkAddress: string
  subject?: string
  id: string
  amount: Amount
  counterParty: string
  user: string
}

export interface PaymentRequestDeclineMessage {
  type: string
  id: string
  subject?: string
}

export interface PaymentMessage {
  type: string
  transferId: string
  subject: string
}

export interface UsernameMessage extends Message {
  username: string
}

export type Direction = 'sent' | 'received'

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
  txFees: TxFeesAmounts
}

export interface TxObjectInternal {
  rawTx: RawTxObject
  txFees: TxFeesAmounts
}

export interface TxObjectRaw {
  rawTx: RawTxObject
  txFees: TxFeesRaw
}

export interface RawTxObject {
  from: string
  to?: string
  value?: number | string | BigNumber
  data?: string
  nonce?: number | string
  baseFee?: number | string | BigNumber
  gasLimit?: number | string | BigNumber
  gasPrice?: number | string | BigNumber
  totalFee?: number | string | BigNumber
  feeRecipient?: string
  currencyNetworkOfFees?: string
}

export interface MetaTransaction {
  from: string
  chainId: number
  version: number
  to: string
  value: string
  data: string
  baseFee: string
  gasPrice: string
  gasLimit: string
  feeRecipient: string
  currencyNetworkOfFees: string
  nonce: string
  timeLimit: string
  operationType: number
  signature?: string
}

export interface MetaTransactionFees {
  baseFee: string
  gasPrice: string
  feeRecipient: string
  currencyNetworkOfFees: string
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

export interface TxFeesRaw {
  gasPrice?: number | string | BigNumber
  gasLimit?: number | string | BigNumber
  baseFee?: number | string | BigNumber
  totalFee: number | string | BigNumber
  feeRecipient?: string
  currencyNetworkOfFees?: string
}

export interface TxFeesAmounts {
  gasPrice?: Amount
  gasLimit?: Amount
  baseFee?: Amount
  totalFee: Amount
  feeRecipient?: string
  currencyNetworkOfFees?: string
}

export interface DelegationFeesObject {
  baseFee: Amount
  gasPrice: Amount
  currencyNetworkOfFees: string
}

export interface DelegationFeesInternal {
  baseFee: AmountInternal
  gasPrice: AmountInternal
  currencyNetworkOfFees: string
}

export interface DelegationFeesRaw {
  baseFee?: number | string | BigNumber
  gasPrice?: number | string | BigNumber
  currencyNetworkOfFees?: string
}

export interface PaidDelegationFeesRaw {
  feeSender: string
  feeRecipient: string
  totalFee: string
  currencyNetworkOfFees: string
}

// PAYMENT
export interface PaymentTxObject extends TxObject {
  path: string[]
  receiverAddress: string
  feePayer: FeePayer
  maxFees: Amount
  transferId?: string
}

export enum FeePayer {
  Sender = 'sender',
  Receiver = 'receiver'
}

export enum TransactionStatus {
  Success = 'success',
  Failure = 'failure',
  Pending = 'pending',
  NotFound = 'not found'
}

export interface MetaTransactionStatus {
  status: TransactionStatus
}

export interface TransactionStatusObject {
  status: TransactionStatus
}

export function isFeePayerValue(feePayer: string) {
  if (
    Object.keys(FeePayer)
      .map(k => FeePayer[k as any])
      .indexOf(feePayer) === -1
  ) {
    return false
  }
  return true
}

export interface PathObject {
  path: string[]
  feePayer: FeePayer
  maxFees: Amount
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
  isFrozen: boolean
}

export interface NetworkDetailsRaw extends Network {
  decimals: number
  numUsers: number
  defaultInterestRate: string
  interestRateDecimals: number
  customInterests: boolean
  preventMediatorInterests: boolean
  isFrozen: boolean
}

export interface UserOverview {
  balance: Amount
  frozenBalance: Amount
  given: Amount
  received: Amount
  leftGiven: Amount
  leftReceived: Amount
}

export interface UserOverviewRaw {
  leftReceived: string
  balance: string
  frozenBalance: string
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

export interface DecimalsMap {
  [networkAddress: string]: DecimalsObject
}

export interface DeployIdentityResponse {
  // The address of the deployed identity contract, as replied by the relay server
  identity: string
  nextNonce: number
  balance: string
}

export interface Signature {
  ecSignature: ECSignature
  concatSig: string
}

// WALLET
export type WalletTypeEthers = 'ethers'
export type WalletTypeIdentity = 'identity'
export type WalletType = WalletTypeEthers | WalletTypeIdentity

export interface TLWalletData {
  version: number
  type: WalletType
  address: string
  meta?: any
}

export interface SigningKey {
  privateKey: string
  mnemonic: string
}

export interface TLWalletDataMeta {
  signingKey: SigningKey
}

export interface EthersWalletData extends TLWalletData {
  type: WalletTypeEthers
  meta: TLWalletDataMeta
}

export interface IdentityWalletData extends TLWalletData {
  type: WalletTypeIdentity
  meta: TLWalletDataMeta
}

export enum NonceMechanism {
  Random = 'random',
  Counting = 'counting'
}

// TRUSTLINE
export interface TrustlineObject {
  id: string
  user: string
  counterParty: string
  balance: Amount
  given: Amount
  received: Amount
  leftGiven: Amount
  leftReceived: Amount
  interestRateGiven: Amount
  interestRateReceived: Amount
  isFrozen: boolean
  currencyNetwork: string
}

export interface TrustlineRaw {
  id: string
  user: string
  counterParty: string
  balance: string
  given: string
  received: string
  leftGiven: string
  leftReceived: string
  interestRateGiven: string
  interestRateReceived: string
  isFrozen: boolean
  currencyNetwork: string
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
   * Payer of thee for the closing transaction
   */
  feePayer: FeePayer
  /**
   * Maximal fees that can occur for closing
   */
  maxFees: Amount
  /**
   * Estimated value to be transferred for closing
   */
  value: Amount
}

export interface ClosePathRaw {
  path: string[]
  feePayer: string
  fees: string
  value: string
}

export interface CloseTxObject extends TxObject {
  path: string[]
  maxFees: Amount
}

// INFORMATIONS

export interface AccruedInterestsRaw {
  value: string
  interestRate: string
  timestamp: number
}

export interface AccruedInterestsObject {
  value: Amount
  interestRate: Amount
  timestamp: number
}

export interface TrustlineAccruedInterestsRaw {
  accruedInterests: AccruedInterestsRaw[]
  user: string
  counterparty: string
}

export interface TrustlineAccruedInterestsObject {
  accruedInterests: AccruedInterestsObject[]
  user: string
  counterparty: string
}

export type UserAccruedInterestsRaw = TrustlineAccruedInterestsRaw[]
export type UserAccruedInterestsObject = TrustlineAccruedInterestsObject[]

export interface MediationFeeRaw {
  value: string
  from: string
  to: string
  transactionHash: string
  timestamp: number
}

export interface MediationFeeObject {
  value: Amount
  from: string
  to: string
  transactionHash: string
  timestamp: number
}

export interface EarnedMediationFeesListRaw {
  user: string
  network: string
  mediationFees: MediationFeeRaw[]
}

export interface EarnedMediationFeesListObject {
  user: string
  network: string
  mediationFees: MediationFeeObject[]
}

export interface TransferredSumRaw {
  sender: string
  receiver: string
  startTime: number
  endTime: number
  value: string
}

export interface TransferredSumObject {
  sender: string
  receiver: string
  startTime: number
  endTime: number
  value: Amount
}

export interface TransferDetailsRaw {
  path: string[]
  currencyNetwork: string
  value: string
  feePayer: string
  totalFees: string
  feesPaid: string[]
  extraData: string
}

export interface TransferDetails {
  path: string[]
  currencyNetwork: string
  value: Amount
  feePayer: FeePayer
  totalFees: Amount
  feesPaid: Amount[]
  extraData: string
  paymentRequestId: string
  transferId: string
  remainingData: string
}

export interface TransferIdentifier {
  blockHash?: string
  logIndex?: number
  txHash?: string
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

export type ReconnectingWSOptions = ReconnectingOptions & {
  reconnectOnError?: boolean
}
