import { Utils } from "./Utils"
import { TLNetwork } from "./TLNetwork"

export class Trustline {

    constructor(private tlNetwork: TLNetwork) {}

    public prepareUpdate(debtor: string, value: number): Promise<string> {
        const { transaction, user } = this.tlNetwork
        return transaction.prepareTransaction("updateCreditline", [`0x${debtor}`, value])
    }

    public prepareAccept(creditor: string) {
        const { transaction, user } = this.tlNetwork
        return transaction.prepareTransaction("acceptCreditline", [`0x${creditor}`])
    }

    public getAll(): Promise<string[]> {
        const { configuration, transaction, user, currencyNetwork } = this.tlNetwork
        return fetch(`${configuration.apiUrl}networks/${currencyNetwork.defaultNetwork}/users/0x${user.address}/trustlines`)
          .then(res => res.json())
          .then(json => json.accounts)
    }
}
