import { Configuration } from './Configuration'

export class TLNetwork {
    private configuration: Configuration

    constructor(config: any = {}) {
        this.configuration = new Configuration(config.host, config.port, config.useWebSockets)
    }
}
