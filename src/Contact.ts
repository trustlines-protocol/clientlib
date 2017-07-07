import { TLNetwork } from "./TLNetwork"

export class Contact {

    constructor(private tlNetwork: TLNetwork) {
    }

    public getAll(): Promise<string[]> {
        const { configuration, user, defaultNetwork } = this.tlNetwork
        return fetch(`${configuration.apiUrl}tokens/${defaultNetwork}/users/0x${user.address}/friends`)
            .then(response => response.json())
            .then(json => json.friends as string[])
            .catch(this.handleError)
    }

    private handleError(error: any) {
        return Promise.reject(error.json().message || error);
    }

}
