import 'mocha'
import * as chai from 'chai'
import * as chaiAsPromised from 'chai-as-promised'
import { TLNetwork } from '../src/TLNetwork'
import { config } from './Fixtures'

describe('CurrencyNetwork', () => {

  chai.use(chaiAsPromised)

  const { expect } = chai
  const { currencyNetwork } = new TLNetwork(config)
  let networks

  before(done => {
    currencyNetwork.getAll().then(allNetworks => {
      networks = allNetworks
      done()
    })
  })

  it('should return array of networks', () => {
    expect(networks).to.be.an('array')
  })

  it('should return registered networks', () => {
    expect(networks).to.have.length.above(0, 'No registered networks')
    expect(networks[0]).to.have.all.keys('name', 'abbreviation', 'address')
    expect(networks[0].name).to.be.a('string')
    expect(networks[0].abbreviation).to.be.a('string').to.be.a('string').and.to.have.length.within(1, 3)
    expect(networks[0].address).to.be.a('string').to.be.a('string').and.to.have.length(42)
  })

  it('should return detailed information of specific currency network', done => {
    currencyNetwork.getInfo(networks[0].address).then(network => {
      expect(network).to.have.all.keys('name', 'abbreviation', 'address', 'numUsers', 'decimals')
      expect(network.abbreviation).to.be.a('string').and.to.have.length.within(1, 3)
      expect(network.address).to.be.a('string').and.to.have.length(42)
      expect(network.decimals).to.be.a('number')
      expect(network.name).to.be.a('string')
      expect(network.numUsers).to.be.a('number')
      done()
    })
  })

  it('getInfo reject invalid address', () => {
    expect(currencyNetwork.getInfo('0x123')).to.eventually.throw()
  })

  it('should return all user addresses of specific currency network', () => {
    expect(currencyNetwork.getUsers(networks[0].address)).to.eventually.be.an('array')
  })

  it('getUsers reject invalid address', () => {
    expect(currencyNetwork.getUsers('0x123')).to.eventually.throw()
  })

  it('should return overview of user in currency network context', done => {
    currencyNetwork.getUserOverview(networks[0].address, '0xf8e191d2cd72ff35cb8f012685a29b31996614ea')
      .then(overview => {
        const { balance, given, received, leftGiven, leftReceived } = overview
        expect(overview).to.have.all.keys('balance', 'given', 'received', 'leftGiven', 'leftReceived')
        expect(balance).to.be.a('number')
        expect(given).to.be.a('number')
        expect(received).to.be.a('number')
        expect(leftGiven).to.equal(given - balance)
        expect(leftReceived).to.equal(received + balance)
        done()
      })
  })

})
