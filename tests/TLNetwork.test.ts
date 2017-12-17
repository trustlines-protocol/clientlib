import { TLNetwork } from '../src/TLNetwork'
import { expect } from 'chai'
import 'mocha'

describe('TLNetwork', () => {

  it('shoult load default configuration', () => {
    const tlNetwork = new TLNetwork()
    expect(tlNetwork).to.be.an('object')
    expect(tlNetwork.configuration.pollInterval).to.equal(500)
    expect(tlNetwork.configuration.useWebSockets).to.be.false
    expect(tlNetwork.configuration.apiUrl).to.equal('http://localhost/')
  })

  it('should load custom configuration', () => {
    const tlNetwork = new TLNetwork({
      protocol: 'https',
      host: '192.168.0.59',
      port: 5000,
      path: 'api/v1/',
      pollInterval: 100
    })
    expect(tlNetwork).to.be.an('object')
    expect(tlNetwork.configuration.pollInterval).to.equal(100)
    expect(tlNetwork.configuration.useWebSockets).to.be.false
    expect(tlNetwork.configuration.apiUrl).to.equal('https://192.168.0.59:5000/api/v1/')
  })

})
