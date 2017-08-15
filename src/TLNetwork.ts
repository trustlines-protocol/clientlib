import { Configuration } from './Configuration'
import { User } from './User'
import { Transaction } from './Transaction'
import { Payment } from './Payment'
import { Trustline } from './Trustline'
import { CurrencyNetwork } from './CurrencyNetwork'
import { Contact } from './Contact'
import { Utils } from './Utils'
import { Event } from './Event'

import { Observable } from 'rxjs/Observable'

export class TLNetwork {
  public configuration: Configuration
  public user: User
  public transaction: Transaction
  public payment: Payment
  public trustline: Trustline
  public currencyNetwork: CurrencyNetwork
  public contact: Contact
  public utils: Utils
  public event: Event

  constructor (config: any = {}) {
    const { protocol, host, port, path, tokenAddress, pollInterval, useMultiple, useWebSockets, wsProtocol } = config
    this.configuration = new Configuration(protocol, host, port, path, pollInterval, useMultiple, useWebSockets, wsProtocol)
    this.utils = new Utils(this.configuration)
    this.transaction = new Transaction(this.utils)
    this.currencyNetwork = new CurrencyNetwork(this.utils)
    this.user = new User(this.transaction, this.utils)
    this.event = new Event(this.user, this.utils)
    this.contact = new Contact(this.user, this.utils)
    this.trustline = new Trustline(this.event, this.user, this.utils, this.transaction)
    this.payment = new Payment(this.event, this.user, this.utils, this.transaction)
  }

}
