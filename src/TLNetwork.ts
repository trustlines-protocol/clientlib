import * as lightwallet from 'eth-lightwallet'

import { Contact } from './Contact'
import { CurrencyNetwork } from './CurrencyNetwork'
import { EthWrapper } from './EthWrapper'
import { Event } from './Event'
import { Exchange } from './Exchange'
import { Messaging } from './Messaging'
import { Payment } from './Payment'
import { Transaction } from './Transaction'
import { Trustline } from './Trustline'
import { User } from './User'

import { RelayProvider } from './providers/RelayProvider'
import { TLProvider } from './providers/TLProvider'

import { LightwalletSigner } from './signers/LightwalletSigner'
import { TxSigner } from './signers/TxSigner'
import { Web3Signer } from './signers/Web3Signer'

import { buildApiUrl } from './utils'

import { TLNetworkConfig } from './typings'

// tslint:disable-next-line
const Web3 = require('web3')

/**
 * The TLNetwork class is the single entry-point into the trustline-network.js library.
 * It contains all of the library's functionality and all calls to the library should be made through a TLNetwork instance.
 */
export class TLNetwork {
  /**
   * User instance containing all user/keystore related methods.
   */
  public user: User
  /**
   * @hidden
   * Transaction instance containing all transaction related methods.
   */
  public transaction: Transaction
  /**
   * Payment instance containing all methods for creating trustline transfers
   * and ETH transfers.
   */
  public payment: Payment
  /**
   * Trustline instance containing all methods for managing trustlines.
   */
  public trustline: Trustline
  /**
   * CurrencyNetwork instance containing all methods for retrieving currency network
   * related information.
   */
  public currencyNetwork: CurrencyNetwork
  /**
   * @hidden
   */
  public contact: Contact
  /**
   * @hidden
   */
  public utils
  /**
   * Event instance for retrieving and formatting event logs.
   */
  public event: Event
  /**
   * Exchange instance containing all methods for making and taking orders.
   */
  public exchange: Exchange
  /**
   * @hidden
   */
  public messaging: Messaging
  /**
   * EthWrapper instance for wrapping and unwrapping ETH.
   */
  public ethWrapper: EthWrapper
  /**
   * @hidden
   */
  public web3: any
  /**
   * @hidden
   */
  public signer: TxSigner

  public relayApiUrl: string
  public relayWsApiUrl: string
  public web3Provider: any

  public provider: TLProvider

  /**
   * Initiates a new TLNetwork instance that provides the public interface to trustlines-network library.
   * @param config Configuration object. See type `TLNetworkConfig` for more information.
   */
  constructor(config: TLNetworkConfig = {}) {
    const {
      protocol = 'http',
      host = 'localhost',
      port = '',
      path = '',
      wsProtocol = 'ws',
      relayApiUrl,
      relayWsApiUrl
    } = config

    this.setProvider(
      new RelayProvider(
        relayApiUrl || buildApiUrl(protocol, host, port, path),
        relayWsApiUrl || buildApiUrl(wsProtocol, host, port, path)
      )
    )

    this.web3 = new Web3(config.web3Provider)
    this.signer = this.web3.eth.currentProvider
      ? new Web3Signer(this.web3)
      : new LightwalletSigner({ lightwallet, provider: this.provider })

    this.currencyNetwork = new CurrencyNetwork(this.provider)
    this.transaction = new Transaction({
      provider: this.provider,
      signer: this.signer
    })
    this.user = new User({
      provider: this.provider,
      signer: this.signer,
      transaction: this.transaction
    })
    this.contact = new Contact({
      provider: this.provider,
      user: this.user
    })
    this.event = new Event({
      currencyNetwork: this.currencyNetwork,
      provider: this.provider,
      user: this.user
    })
    this.messaging = new Messaging({
      currencyNetwork: this.currencyNetwork,
      provider: this.provider,
      user: this.user
    })
    this.trustline = new Trustline({
      currencyNetwork: this.currencyNetwork,
      event: this.event,
      provider: this.provider,
      transaction: this.transaction,
      user: this.user
    })
    this.payment = new Payment({
      currencyNetwork: this.currencyNetwork,
      event: this.event,
      provider: this.provider,
      transaction: this.transaction,
      user: this.user
    })
    this.exchange = new Exchange({
      currencyNetwork: this.currencyNetwork,
      event: this.event,
      payment: this.payment,
      provider: this.provider,
      transaction: this.transaction,
      user: this.user
    })
    this.ethWrapper = new EthWrapper({
      provider: this.provider,
      transaction: this.transaction,
      user: this.user
    })
  }

  public setProvider(provider: RelayProvider): void {
    this.provider = provider
  }
}
