export class Configuration {
    // url of rest api
    public apiUrl: string
    // url of websocket api
    public wsApiUrl: string

    constructor(
        // host of the REST relay server
        public host: string = "localhost",
        // port of REST relay server
        public port: number = 5000,
        // address of the token
        public tokenAddress: string = "0x61f3a6deebc44c0421f5d8e5a34cf5f21e862b39",
        // poll interval
        public pollInterval: number = 500,
        // use websockets?
        public useWebSockets: boolean = false
    ) {
        this.apiUrl = `http://${this.host}:${this.port}/api/`
        this.wsApiUrl = `ws://${this.host}:${this.port}/api/`
    }
}
