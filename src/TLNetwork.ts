import { Configuration } from "./Configuration"
import { User } from "./User"
import { Transaction } from "./Transaction"
import { Payment } from "./Payment"
import { Trustline } from "./Trustline"
import { CurrencyNetwork } from "./CurrencyNetwork"
import { Contact } from "./Contact"
import { ObservableHelper } from "./ObservableHelper"

import { Observable } from "rxjs/Observable"

export class TLNetwork {

    public configuration: Configuration
    public user: User
    public transaction: Transaction
    public payment: Payment
    public trustline: Trustline
    public currencyNetwork: CurrencyNetwork
    public contact: Contact
    public observableHelper: ObservableHelper
    public networks: string[]
    public defaultNetwork: string

    constructor(config: any = {}) {
        const { host, port, tokenAddress, pollInterval, useWebSockets } = config
        this.configuration = new Configuration(host, port, pollInterval, useWebSockets)
        this.user = new User()
        this.transaction = new Transaction(this)
        this.payment = new Payment(this)
        this.trustline = new Trustline(this)
        this.currencyNetwork = new CurrencyNetwork(this)
        this.contact = new Contact(this)
        this.observableHelper = new ObservableHelper()
    }

    public createUser(username: string): Promise<object> {
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

    public loadUser(serializedKeystore: string) {
        return new Promise((resolve, reject) => {
            if (serializedKeystore) { // TODO: check if valid keystore
                this.user.keystore = this.user.deserializeKeystore(serializedKeystore)
                this.user.address = this.user.keystore.getAddresses()[0]
                const loadedUser = {
                    username: this.user.username,
                    address: this.user.address,
                    keystore: this.user.keystore.serialize()
                }
                this.currencyNetwork.getNetworks().then((networks) => {
                    this.networks = networks
                    this.defaultNetwork = networks[0]
                    resolve(loadedUser)
                })
            } else {
                reject(new Error("No valid keystore"))
            }
        })
    }

    public sendPayment(receiver: string, value: number) {
        return this.payment.mediatedTransfer(receiver, value)
    }

    public getEvents(block: number): Observable<any> {
        const pollEventsUrl = `tokens/${this.defaultNetwork}/users/0x${this.user.address}/block/${block}/events`
        return this.observableHelper.createObservable(this.configuration, pollEventsUrl)
    }
}
