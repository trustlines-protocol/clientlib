import { TLNetwork } from '../src/TLNetwork'
import { expect } from 'chai'
import 'mocha'
import { config } from './Fixtures'

describe('CurrencyNetwork', () => {

  const { currencyNetwork } = new TLNetwork(config)
  let allNetworks

  it('should return all registered currency network', done => {
    currencyNetwork.getAll().then(networks => {
      allNetworks = networks
      expect(networks).to.be.an('array')
      expect(networks).to.have.length.above(0)
      done()
    })
  })

  it('should return detailed information of specific currency network', done => {
    currencyNetwork.getInfo(allNetworks[0].address).then(network => {
      expect(network).to.be.an('object')
      expect(network.abbreviation).to.be.a('string').and.to.have.length.within(1, 3)
      expect(network.numUsers).to.be.a('number')
      expect(network.name).to.be.a('string')
      expect(network.address).to.be.a('string').and.to.have.length(42)
      done()
    })
  })

  it('should return all user addresses of specific currency network', done => {
    currencyNetwork.getUsers(allNetworks[0].address).then(users => {
      expect(users).to.be.an('array')
      done()
    })
  })

  it('should return overview of user in currency network context', done => {
    currencyNetwork.getUserOverview(allNetworks[0].address, '0xf8e191d2cd72ff35cb8f012685a29b31996614ea')
      .then(overview => {
        const { balance, given, received, leftGiven, leftReceived } = overview
        expect(overview).to.be.an('object')
        expect(balance).to.be.a('number')
        expect(given).to.be.a('number')
        expect(received).to.be.a('number')
        expect(leftGiven).to.equal(given - balance)
        expect(leftReceived).to.equal(received + balance)
        done()
      })
  })

})
