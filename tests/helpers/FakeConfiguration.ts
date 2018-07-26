import { Configuration } from '../../src/Configuration'

export class FakeConfiguration extends Configuration {
  public apiUrl: string = 'http://localhost:5000/api/v1'
  public wsApiUrl: string = 'ws://localhost:5000/api/v1'
}
