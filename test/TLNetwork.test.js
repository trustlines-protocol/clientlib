const chai = require('chai');
const expect = chai.expect;
const TLNetwork = require('../dist/trustlines-network.js').TLNetwork;

describe('TLNetwork Class', () => {
    const tlNetwork = new TLNetwork()

    it('TLNetwork can be initiated', () => {
        expect(tlNetwork).to.be.an('object')
    })

    it('createUser creates new user', () => {
        return tlNetwork.createUser('username').then((createdUser) => {
            console.log(createdUser)
            expect(createdUser).to.be.an('object')
        })
    })

    it('loadUser loads existing user', () => {
        const serializedKeystore = '{"encSeed":{"encStr":"fdlM/t1VWFVsx6bKVdX4rrhFGJiVKyZbnYWRnLjGBQLM5zkgC73Sf9JzQxTIXSty+G+oMV1lLXoSaZMnoWLJWxocYCjqmrNicTBn7axYPRqy+hMO9j1LDe9q2cAQkXYQzAk4TS0bt9u/hRG0RBXhDRbrPscZVEz0fC/88WD90/9yJmZS+UcxJw==","nonce":"H/WfxRenyr217DHELcQT0GF3QZmqwh0r"},"ksData":{"m/0\'/0\'/0\'":{"info":{"curve":"secp256k1","purpose":"sign"},"encHdPathPriv":{"encStr":"GR5Y+sXtlEuOuiRjOQMtbnAMGbu/aAkZAqlCiKDAOBADObQ6YUt1NYEVhvJN5Zq+GP2kItWuWgIo2NpZd/AgcMwC9AV/6Rnh3ITowgXkVmAMyr7npmvBBqRpUmvkiVB6LdafeHuuyFVkhI3ogg67WVbWCdwblUBH8BLacz28Kg==","nonce":"P1bJi2k8K0CupFOhiI/Y3MmUCayeR3vf"},"hdIndex":1,"encPrivKeys":{"e841e9b27431beb996f44c14a21f510613bf90aa":{"key":"aiNfdXk7N5kk+8H3hctfCjyCBzflnlhp8b96bgb8QubRBWlfxNN8S8jdS5prcW/0","nonce":"cZP40dVKDx69gXnCMSNwJq+qaKIxdpFa"}},"addresses":["e841e9b27431beb996f44c14a21f510613bf90aa"]}},"encHdRootPriv":{"encStr":"+NlL1mNXpZwh0TVGl4ON8GwTgJHHt+KsTtW91qHypbmUPaFOKPf8iEImoRR38rxGJTyplKbw/h3LuyI9XGcCeacR7HGFZaQsrw8vehNm4hrVYdbijGwHEVEAJ5gs070cOpJHDpf75kK3li14TtxHVW/nSDxtyPHSq6amPkqSHw==","nonce":"mWCUhPdymK4VrR52a2ZHSibjXZcuclSh"},"salt":"njcNILd2XXQpF9ki4YzSiAfVPUzQu89WKlkI7F4/eXA=","version":2}'
        return tlNetwork.loadUser(serializedKeystore).then((loadedUser) => {
            console.log(loadedUser)
            expect(loadedUser).to.be.an('object')
        })
    })
})
