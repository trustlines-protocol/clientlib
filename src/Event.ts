import { Utils } from "./Utils"
import { CurrencyNetwork } from "./CurrencyNetwork"
import { User } from "./User"

import { Observable } from "rxjs/Observable"

export class Event {

    private validParameters = ["type", "fromBlock", "toBlock"]

    constructor(
        private utils: Utils,
        private currencyNetwork: CurrencyNetwork,
        private user: User
    ) {}

    public eventObservable(filter?: object): Observable<any> {
        const { currencyNetwork, user, utils, validParameters } = this
        const baseUrl = `networks/${currencyNetwork.defaultNetwork}/users/0x${user.address}/events`
        const parameterUrl = utils.buildUrl(baseUrl, validParameters, filter)
        return utils.createObservable(parameterUrl)
    }

    public get(filter?: object): Promise<object[]> {
        const { currencyNetwork, user, utils, validParameters } = this
        const baseUrl = `networks/${currencyNetwork.defaultNetwork}/users/0x${user.address}/events`
        const parameterUrl = utils.buildUrl(baseUrl, validParameters, filter)
        return utils.fetchUrl(parameterUrl)
    }

}
