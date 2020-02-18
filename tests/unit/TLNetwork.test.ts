import { expect } from 'chai'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'

describe('unit', () => {
  describe('TLNetwork', () => {
    describe('#constructor()', () => {
      it('should load default configuration', () => {
        const tlNetwork = new TLNetwork()
        expect(tlNetwork.relayProvider.ApiUrl).to.equal('http://localhost')
        expect(tlNetwork.relayProvider.WsApiUrl).to.equal('ws://localhost')
        expect(tlNetwork.messagingProvider.ApiUrl).to.equal('http://localhost')
        expect(tlNetwork.messagingProvider.WsApiUrl).to.equal('ws://localhost')
      })

      it('should load custom configuration', () => {
        const tlNetwork = new TLNetwork({
          relayUrl: {
            host: '192.168.0.59',
            path: 'api/v1',
            port: 5000,
            protocol: 'https'
          },
          messagingUrl: {
            host: '192.168.0.1',
            path: 'messaging/api/v1',
            port: 4000,
            protocol: 'http'
          }
        })
        expect(tlNetwork).to.be.an('object')
        expect(tlNetwork.relayProvider.ApiUrl).to.equal(
          'https://192.168.0.59:5000/api/v1'
        )
        expect(tlNetwork.relayProvider.WsApiUrl).to.equal(
          'wss://192.168.0.59:5000/api/v1'
        )
        expect(tlNetwork.messagingProvider.ApiUrl).to.equal(
          'http://192.168.0.1:4000/messaging/api/v1'
        )
        expect(tlNetwork.messagingProvider.WsApiUrl).to.equal(
          'ws://192.168.0.1:4000/messaging/api/v1'
        )
      })
    })
  })
})
