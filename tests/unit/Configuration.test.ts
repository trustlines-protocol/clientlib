import { assert } from 'chai'
import 'mocha'

import { Configuration } from '../../src/Configuration'

describe('unit', () => {
  describe('Configuration', () => {
    const DEFAULT_API_URL = 'http://localhost'
    const DEFAULT_WS_API_URL = 'ws://localhost'

    describe('#constructor()', () => {
      it('should set default configuration', () => {
        const { apiUrl, wsApiUrl, web3Provider } = new Configuration()
        assert.equal(apiUrl, DEFAULT_API_URL)
        assert.equal(wsApiUrl, DEFAULT_WS_API_URL)
        assert.notOk(web3Provider)
      })

      it('should set correct path for multiple ending slashes', () => {
        const { apiUrl, wsApiUrl, web3Provider } = new Configuration({
          host: 'testhost',
          path: 'api/////',
          port: 8080,
          protocol: 'https',
          web3Provider: 'ws://rpchost:8546',
          wsProtocol: 'ws'
        })
        assert.equal(apiUrl, 'https://testhost:8080/api')
        assert.equal(wsApiUrl, 'ws://testhost:8080/api')
        assert.equal(web3Provider, 'ws://rpchost:8546')
      })

      it('should set correct path for multiple starting slashes', () => {
        const { apiUrl, wsApiUrl, web3Provider } = new Configuration({
          host: 'testhost',
          path: '/////api',
          port: 8080,
          protocol: 'https',
          web3Provider: 'ws://rpchost:8546',
          wsProtocol: 'ws'
        })
        assert.equal(apiUrl, 'https://testhost:8080/api')
        assert.equal(wsApiUrl, 'ws://testhost:8080/api')
        assert.equal(web3Provider, 'ws://rpchost:8546')
      })

      it('should set specified configuration with trimmed path', () => {
        const { apiUrl, wsApiUrl, web3Provider } = new Configuration({
          host: 'testhost.com',
          path: '///api/v1/////',
          port: 8080,
          protocol: 'https',
          web3Provider: 'ws://rpchost:8546',
          wsProtocol: 'ws'
        })
        assert.equal(apiUrl, 'https://testhost.com:8080/api/v1')
        assert.equal(wsApiUrl, 'ws://testhost.com:8080/api/v1')
        assert.equal(web3Provider, 'ws://rpchost:8546')
      })
    })
  })
})
