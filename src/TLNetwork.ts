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
    this.currencyNetwork = new CurrencyNetwork(this.user, this.utils)
    this.event = new Event(this.utils, this.currencyNetwork, this.user)
    this.contact = new Contact(this.currencyNetwork, this.user, this.utils)
    this.transaction = new Transaction(this.user, this.utils, this.currencyNetwork)
    this.trustline = new Trustline(this.user, this.utils, this.transaction, this.currencyNetwork)
    this.payment = new Payment(this.user, this.utils, this.transaction, this.currencyNetwork)
  }

  public createUser (username: string, defaultNetwork?: string): Promise<object> {
    this.user.username = username
    return new Promise((resolve, reject) => {
      this.user.generateKey().then((address) => {
        this.user.address = address
        const createdUser = {
          username: this.user.username,
          address: this.user.address,
          keystore: this.user.keystore.serialize()
        }
        resolve(createdUser)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  public loadUser (serializedKeystore: string, defaultNetwork?: string): Promise<object> {
    return new Promise((resolve, reject) => {
      if (serializedKeystore) { // TODO: check if valid keystore
        this.user.keystore = this.user.deserializeKeystore(serializedKeystore)
        this.user.address = this.user.keystore.getAddresses()[ 0 ]
        const loadedUser = {
          username: this.user.username,
          address: this.user.address,
          keystore: this.user.keystore.serialize()
        }
        this.currencyNetwork.getAll().then(networks => {
          this.currencyNetwork.networks = networks
          if (defaultNetwork) {
            this.currencyNetwork.defaultNetwork = defaultNetwork
          } else {
            this.currencyNetwork.defaultNetwork = networks[ 0 ].address
          }
          resolve(loadedUser)
        })
      } else {
        reject(new Error('No valid keystore'))
      }
    })
  }
}
