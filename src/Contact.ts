import { TLNetwork } from "./TLNetwork"

export class Contact {

    constructor(private tlNetwork: TLNetwork) {
    }

    public getAll(): Promise<string[]> {
        const { configuration, user, defaultNetwork, utils } = this.tlNetwork
        const url = `${configuration.apiUrl}tokens/${defaultNetwork}/users/0x${user.address}/friends`
        return utils.fetchUrl(url)
    }

}
