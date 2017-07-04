import { Configuration } from './Configuration'
import { User } from './User'
import { Transaction } from './Transaction'

const lightwallet = require("eth-lightwallet")

export class Payment {

    private baseResource: string
    private transaction: Transaction

    constructor(
        private config: Configuration,
        private user: User
    ) {
        this.baseResource = `${this.config.apiUrl}tokens/${this.config.tokenAddress}`
        this.transaction = new Transaction(this.config, this.user)
    }

    public mediatedTransfer(receiver: string, value: number): Promise<string> {
        return this.getPath(this.user.address, receiver, value)
            .then((path) => {
                if (path.length > 0) {
                    return this.transaction.prepareTransaction(
                        "mediatedTransfer",
                        ["0x" + receiver, value, path.slice(1)]
                    )
                } else {
                    return Promise.reject<string>("Could not find a path with enough capacity")
                }
            })
            .then((tx) => this.user.signTx(tx))
            .then((tx) => this.transaction.relayTx(tx))
    }

    public getPath(accountA: string, accountB: string, value: number): Promise<string[]> {
        return fetch(`${this.baseResource}/users/0x${accountA}/path/0x${accountB}/value/${value}`)
            .then((response) => response.json())
            .then((json) => json.path as string[])
            .catch(this.handleError)
    }

    private handleError(error: any) {
        return Promise.reject(error.json().message || error);
    }

}
