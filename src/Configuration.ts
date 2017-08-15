export class Configuration {
  // url of rest api
  public apiUrl: string
  // url of websocket api
  public wsApiUrl: string
  // whitelist of relay servers
  public whitelist = [
    'http://localhost:5000',
    'http://localhost:5001',
    'http://localhost:5002',
    'http://localhost:5003'
  ]

  constructor (// protocol of the REST relay server
    public protocol: string = 'http',
    // port of REST relay server
    public host: string = 'localhost',
    // port of REST relay server
    public port: number = 5000,
    // path of REST relay server, if set should end with trailing slash
    public path: string = '',
    // poll interval
    public pollInterval: number = 500,
    // use multiple relay servers?
    public useMultiple: boolean = false,
    // use websockets?
    public useWebSockets: boolean = false,
    // protocol of the REST relay server
    public wsProtocol: string = 'ws') {
    this.apiUrl = `${this.protocol}://${this.host}:${this.port}/${this.path}`
    this.wsApiUrl = `${this.wsProtocol}://${this.host}:${this.port}/${this.path}`
  }
}
