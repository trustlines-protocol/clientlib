export class Configuration {
    // url of rest api
    private apiUrl: string
    // ws url
    private wsApiUrl: string

    constructor(
        // url of the REST relay server
        private host: string = "localhost",
        // port of REST relay server
        private port: number = 5000,
        // use websockets?
        private useWebSockets: boolean = false
    ) {
        this.apiUrl = `http://${this.host}:${this.port}/api/`
        this.wsApiUrl = `ws://${this.host}:${this.port}/api/`
    }
}
