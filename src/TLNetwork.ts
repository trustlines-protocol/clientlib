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
    const { host, port, tokenAddress, pollInterval, useWebSockets } = config
    this.configuration = new Configuration(host, port, pollInterval, useWebSockets)
    this.user = new User()
    this.utils = new Utils(this.configuration)
    this.currencyNetwork = new CurrencyNetwork(this.utils)
    this.event = new Event(this.user, this.utils)
    this.contact = new Contact(this.user, this.utils)
    this.transaction = new Transaction(this.user, this.utils)
    this.trustline = new Trustline(this.event, this.user, this.utils, this.transaction)
    this.payment = new Payment(this.event, this.user, this.utils, this.transaction)
  }

}
