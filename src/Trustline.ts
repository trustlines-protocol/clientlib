import { ObservableHelper } from "./ObservableHelper"
import { TLNetwork } from "./TLNetwork"

export class Trustline {

    constructor(private tlNetwork: TLNetwork) {}

    public update(debtor: string, value: number): Promise<string> {
        const { transaction, user } = this.tlNetwork
        return transaction.prepareTransaction("updateCreditline", ["0x" + debtor, value])
            .then((tx) => user.signTx(tx))
            .then((tx) => transaction.relayTx(tx))
    }

    // TODO: define smart contract method
    public accept(creditor: string) {
        const { transaction, user } = this.tlNetwork
        return transaction.prepareTransaction("acceptCreditline", ["0x" + creditor])
            .then((tx) => user.signTx(tx))
            .then((tx) => transaction.relayTx(tx))
    }

    // TODO: define smart contract method
    public decline(creditor: string) {
        const { transaction, user } = this.tlNetwork
        return transaction.prepareTransaction("declineCreditline", ["0x" + creditor])
            .then((tx) => user.signTx(tx))
            .then((tx) => transaction.relayTx(tx))
    }

    public getAll(): Promise<string[]> {
        const { configuration, transaction, user, defaultNetwork } = this.tlNetwork
        return fetch(`${configuration.apiUrl}tokens/${defaultNetwork}users/0x${user.address}/accounts/`)
          .then(res => res.json())
          .then(json => json.accounts)
    }
}
