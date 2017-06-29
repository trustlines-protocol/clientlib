import { Configuration } from './Configuration'

export class TLNetwork {
    private configuration: Configuration

    constructor(config: any = {}) {
        const { host, port, tokenAddress, pollInterval, useWebSockets } = config
        this.configuration = new Configuration(host, port, tokenAddress, pollInterval, useWebSockets)
    }
}
