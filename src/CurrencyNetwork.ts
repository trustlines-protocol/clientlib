import { Utils } from "./Utils"

export class CurrencyNetwork {

    public defaultNetwork: string
    public networks: string[]

    constructor(private utils: Utils) {}

    public getAll(): Promise<any[]> {
        return this.utils.fetchUrl(`networks`)
    }

    public getNetworkInfo(address: string): Promise<any> {
        return this.utils.fetchUrl(`networks/${address}`)
    }

}
