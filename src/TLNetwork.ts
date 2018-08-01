import { Configuration } from './Configuration'
import { User } from './User'
import { Transaction } from './Transaction'
import { Payment } from './Payment'
import { Trustline } from './Trustline'
import { CurrencyNetwork } from './CurrencyNetwork'
import { Contact } from './Contact'
import { Utils } from './Utils'
import { Event } from './Event'
import { Exchange } from './Exchange'
import { Messaging } from './Messaging'
import { EthWrapper } from './EthWrapper'

import { TxSigner } from './signers/TxSigner'
import { LightwalletSigner } from './signers/LightwalletSigner'
import { Web3Signer } from './signers/Web3Signer'

import { TLNetworkConfig, TxOptionsInternal } from './typings'

const Web3 = require('web3')

/**
 * The TLNetwork class is the single entry-point into the trustline-network.js library.
 * It contains all of the library's functionality and all calls to the library should be made through a TLNetwork instance.
 */
export class TLNetwork {
  /**
   * @hidden
   * Configuration instance containing all configurable parameters.
   */
  public configuration: Configuration
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

  /**
   * Initiates a new TLNetwork instance that provides the public interface to trustlines-network library.
   * @param config Configuration object. See type `TLNetworkConfig` for more information.
   */
  constructor (config: TLNetworkConfig = {}) {
    this.configuration = new Configuration(config)
    this.utils = new Utils(this.configuration)
    this.currencyNetwork = new CurrencyNetwork(this.utils)
    this.web3 = new Web3(config.web3Provider)
    this.signer = this.web3.eth.currentProvider
      ? new Web3Signer(this.web3)
      : new LightwalletSigner(this.utils)
    this.transaction = new Transaction(this.utils, this.signer)
    this.user = new User(this.signer, this.transaction, this.utils)
    this.contact = new Contact(this.user, this.utils)
    this.event = new Event(this.user, this.utils, this.currencyNetwork)
    this.trustline = new Trustline(this.event, this.user, this.utils, this.transaction, this.currencyNetwork)
    this.payment = new Payment(this.event, this.user, this.utils, this.transaction, this.currencyNetwork)
    this.exchange = new Exchange(this.event, this.user, this.utils, this.transaction, this.currencyNetwork, this.payment)
    this.messaging = new Messaging(this.user, this.utils, this.currencyNetwork)
    this.ethWrapper = new EthWrapper(this.user, this.utils, this.transaction)
  }
}
