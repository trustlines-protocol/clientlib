export class Configuration {
  // url of rest api
  public apiUrl: string
  // url of websocket api
  public wsApiUrl: string

  constructor (// protocol of the REST relay server
    public protocol: string = 'http',
    // port of REST relay server
    public host: string = 'localhost',
    // port of REST relay server
    public port: number = 80,
    // path of REST relay server, if set should end with trailing slash
    public path: string = '',
    // poll interval
    public pollInterval: number = 500,
    // use websockets?
    public useWebSockets: boolean = false,
    // protocol of the REST relay server
    public wsProtocol: string = 'ws') {
    this.apiUrl = `${this.protocol}://${this.host}${(this.port === 80) ? '' : ':' + this.port}/${this.path}`
    this.wsApiUrl = `${this.wsProtocol}://${this.host}:${this.port}/${this.path}`
  }
}
