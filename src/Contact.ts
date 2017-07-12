import { User } from "./User"
import { Utils } from "./Utils"
import { CurrencyNetwork } from "./CurrencyNetwork"

export class Contact {

    constructor(
        private currencyNetwork: CurrencyNetwork,
        private user: User,
        private utils: Utils
    ) {}

    public getAll(): Promise<string[]> {
        const { user, utils, currencyNetwork } = this
        const url = `networks/${currencyNetwork.defaultNetwork}/users/0x${user.address}/contacts`
        return utils.fetchUrl(url)
    }

}
