var chai = require('chai');
var expect = chai.expect;
var TLNetwork = require('../dist/TLNetwork.js').TLNetwork;

describe('TLNetwork Class', () => {
    it('TLNetwork can be constructed', () => {
        var tl = new TLNetwork()
        expect(tl).to.be.an('object')
    })
})
