import { BigNumber } from 'bignumber.js'
import { TxSigner } from '../../src/signers/TxSigner'
import { TxInfos, RawTxObject } from '../../src/typings'

/**
 * Mock TxSigner interface
 */
export class FakeTxSigner implements TxSigner {
  signer: string = 'lightwallet'

  /**
   * Mock txSigner.getTxInfos
   */
  async getTxInfos (userAddress: string): Promise<TxInfos> {
    return Promise.resolve({
      gasPrice: new BigNumber('2000000'),
      balance: new BigNumber('1000000'),
      nonce: 15
    })
  }

  /**
   * Mock txSigner.confirm
   */
  async confirm (rawTx: RawTxObject): Promise<any> {
    return Promise.resolve(this.signer === 'lightwallet'
      ? '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b'
      : {
        from: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
        to: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
        status: true,
        transactionHash: '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
        transactionIndex: 0,
        blockHash: '0xef95f2f1ed3ca60b048b4bf67cde2195961e0bba6f70bcbea9a2c4e133e34b46',
        blockNumber: 3,
        contractAddress: '0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe',
        cumulativeGasUsed: 314159,
        gasUsed: 30234,
        logs: [{
          data: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
          topics: ['0xfd43ade1c09fade1c0d57a7af66ab4ead7c2c2eb7b11a91ffdd57a7af66ab4ead7', '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385'],
          logIndex: 0,
          transactionIndex: 0,
          transactionHash: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
          blockHash: '0xfd43ade1c09fade1c0d57a7af66ab4ead7c2c2eb7b11a91ffdd57a7af66ab4ead7',
          blockNumber: 1234,
          address: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe'
        }]
      }
    )
  }
}
