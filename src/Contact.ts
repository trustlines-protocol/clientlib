import { User } from "./User"
import { Utils } from "./Utils"

export class Contact {

    constructor(private user: User, private utils: Utils) {}

    public getAll(networkAddress: string): Promise<string[]> {
        const { user, utils } = this
        const url = `networks/${networkAddress}/users/0x${user.proxyAddress}/contacts`
        return utils.fetchUrl(url)
    }

}
