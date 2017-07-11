import { Utils } from "./Utils"

export class CurrencyNetwork {

    public defaultNetwork: string
    public networks: string[]

    constructor(private utils: Utils) {}

    public getAll(): Promise<any[]> {
        return this.utils.fetchUrl(`networks`)
    }

    public getInfo(address: string): Promise<object> {
        return this.utils.fetchUrl(`networks/${address}`)
    }

    public getUsers(networkAddress: string): Promise<object[]> {
        return this.utils.fetchUrl(`networks/${networkAddress}/users`)
    }

    public getUserOverview(networkAddress: string, userAddress: string): Promise<object> {
        return this.utils.fetchUrl(`networks/${networkAddress}/users/${userAddress}`)
    }

}
