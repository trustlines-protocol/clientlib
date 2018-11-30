import { expect } from 'chai'
import 'mocha'

import { TLNetwork } from '../../src/TLNetwork'

describe('unit', () => {
  describe('TLNetwork', () => {
    describe('#constructor()', () => {
      it('should load default configuration', () => {
        const tlNetwork = new TLNetwork()
        expect(tlNetwork).to.be.an('object')
        expect(tlNetwork.configuration.apiUrl).to.equal('http://localhost/')
      })

      it('should load custom configuration', () => {
        const tlNetwork = new TLNetwork({
          host: '192.168.0.59',
          path: 'api/v1/',
          port: 5000,
          protocol: 'https'
        })
        expect(tlNetwork).to.be.an('object')
        expect(tlNetwork.configuration.apiUrl).to.equal(
          'https://192.168.0.59:5000/api/v1/'
        )
      })
    })
  })
})
