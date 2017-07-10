import { TLNetwork } from "./TLNetwork"

export class CurrencyNetwork {

    constructor(private tlNetwork: TLNetwork) {}

    public getAll(): Promise<string[]> {
        const { configuration, utils } = this.tlNetwork
        return utils.fetchUrl(`${configuration.apiUrl}tokens`)
    }

    public getNetworkInfo(address: string): Promise<any> {
        const { configuration, utils } = this.tlNetwork
        return utils.fetchUrl(`${configuration.apiUrl}tokens/${address}`)
    }

}
