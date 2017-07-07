import { TLNetwork } from "./TLNetwork"

export class CurrencyNetwork {

    constructor(private tlNetwork: TLNetwork) {}

    public getNetworks(): Promise<string[]> {
        const { configuration, user } = this.tlNetwork
        // TODO define relay api
        return fetch(`${configuration.apiUrl}tokens/users/${user.address}`)
            .then(res => res.json())
            .then(json => json.tokens)
            .catch(e => console.error(e))
    }

    public getAllNetworks(): Promise<string[]> {
        const { configuration } = this.tlNetwork
        return fetch(`${configuration.apiUrl}tokens`)
            .then(res => res.json())
            .then(json => json.tokens)
            .catch(e => console.error(e))
    }

    public getNetworkInfo(address: string): Promise<any> {
        const { configuration } = this.tlNetwork
        return fetch(`${configuration.apiUrl}tokens/${address}`)
            .then(res => res.json())
            .catch(e => console.error(e))
    }

}
