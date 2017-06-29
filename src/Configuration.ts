export class Configuration {
    // url of rest api
    private apiUrl: string
    // url of websocket api
    private wsApiUrl: string

    constructor(
        // host of the REST relay server
        private host: string = "localhost",
        // port of REST relay server
        private port: number = 5000,
        // address of the token
        private tokenAddress: string = "0x61f3a6deebc44c0421f5d8e5a34cf5f21e862b39",
        // poll interval
        private pollInterval: number = 500,
        // use websockets?
        private useWebSockets: boolean = false
    ) {
        this.apiUrl = `http://${this.host}:${this.port}/api/`
        this.wsApiUrl = `ws://${this.host}:${this.port}/api/`
    }
}
