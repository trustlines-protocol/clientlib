var chai = require('chai');
var expect = chai.expect;
var TLNetwork = require('../dist/trustlines-network.js').TLNetwork;

describe('TLNetwork Class', () => {
    var tlNetwork = new TLNetwork()

    it('TLNetwork can be initiated', () => {
        expect(tlNetwork).to.be.an('object')
    })

    it('createUser creates new user', () => {
        return tlNetwork.createUser().then((createdUser) => {
            console.log(createdUser)
            expect(createdUser).to.be.an('object')
        })
    })
})
