import { Configuration } from './Configuration'
import { User } from './User'

export class TLNetwork {
    private configuration: Configuration
    private user: User

    constructor(config: any = {}) {
        const { host, port, tokenAddress, pollInterval, useWebSockets } = config
        this.configuration = new Configuration(host, port, tokenAddress, pollInterval, useWebSockets)
        this.user = new User()
    }

    public createUser(username: string) {
        this.user.username = username
        return new Promise((resolve, reject) => {
            this.user.generateKey().then((address) => {
                this.user.address = address
                const createdUser = {
                    username: this.user.username,
                    address: this.user.address,
                    keystore: this.user.keystore
                }
                resolve(createdUser)
            }).catch((err) => {
                reject(err)
            })
        })
    }

    public loadUser(keystore: string) {
        this.user.keystore = keystore
    }
}
