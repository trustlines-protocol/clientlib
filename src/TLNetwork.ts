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
import { Utils } from './Utils'

import { LightwalletSigner } from './signers/LightwalletSigner'
import { TxSigner } from './signers/TxSigner'
import { Web3Signer } from './signers/Web3Signer'

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
  public utils: Utils
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

  /**
   * Initiates a new TLNetwork instance that provides the public interface to trustlines-network library.
   * @param config Configuration object. See type `TLNetworkConfig` for more information.
   */
  constructor(config: TLNetworkConfig = {}) {
    this.utils = new Utils()

    this.setConfig(config)

    this.currencyNetwork = new CurrencyNetwork(this.relayApiUrl, this.utils)
    this.web3 = new Web3(config.web3Provider)
    this.signer = this.web3.eth.currentProvider
      ? new Web3Signer(this.web3)
      : new LightwalletSigner(lightwallet, this.relayApiUrl, this.utils)
    this.transaction = new Transaction(
      this.utils,
      this.signer,
      this.relayApiUrl
    )
    this.user = new User(
      this.signer,
      this.transaction,
      this.utils,
      this.relayApiUrl
    )
    this.contact = new Contact(this.relayApiUrl, this.user, this.utils)
    this.event = new Event(
      this.user,
      this.utils,
      this.currencyNetwork,
      this.relayApiUrl,
      this.relayWsApiUrl
    )
    this.trustline = new Trustline(
      this.event,
      this.user,
      this.utils,
      this.transaction,
      this.currencyNetwork,
      this.relayApiUrl
    )
    this.payment = new Payment(
      this.event,
      this.user,
      this.utils,
      this.transaction,
      this.currencyNetwork,
      this.relayApiUrl
    )
    this.exchange = new Exchange(
      this.event,
      this.user,
      this.utils,
      this.transaction,
      this.currencyNetwork,
      this.payment,
      this.relayApiUrl
    )
    this.messaging = new Messaging(
      this.user,
      this.utils,
      this.currencyNetwork,
      this.relayApiUrl,
      this.relayWsApiUrl
    )
    this.ethWrapper = new EthWrapper(
      this.relayApiUrl,
      this.transaction,
      this.user,
      this.utils
    )
  }

  public setConfig(config: TLNetworkConfig = {}): void {
    const {
      protocol = 'http',
      host = 'localhost',
      port = '',
      path = '',
      wsProtocol = 'ws',
      relayApiUrl,
      relayWsApiUrl
    } = config

    this.relayApiUrl =
      relayApiUrl || this.utils.buildApiUrl(protocol, host, port, path)
    this.relayWsApiUrl =
      relayWsApiUrl || this.utils.buildApiUrl(wsProtocol, host, port, path)
  }
}
