import { Web3TxReceipt, RawTxObject } from '../../src/typings'

/**
 * This class mocks a web3 provider used for testing purposes.
 */
export class FakeWeb3Provider {
  public eth: any

  constructor () {
    this.eth = {
      sendTransaction: txObject => this._sendTransaction(txObject),
      getGasPrice: () => Promise.resolve('20000000000'),
      getTransactionCount: address => Promise.resolve(5),
      getBalance: address => '1000000000000',
      abi: {
        encodeFunctionCall: (jsonInterface, params) => this._encodeFunctionCall(jsonInterface, params)
      }
    }
  }

  /**
   * Mock web3.eth.sendTransaction and return fake transaction receipt.
   */
  private async _sendTransaction (transactionObject: RawTxObject): Promise<Web3TxReceipt> {
    return Promise.resolve({
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
    })
  }

  /**
   * Mock web3.eth.abi.encodeFunctionCall
   */
  private _encodeFunctionCall (jsonInterface, parameters): string {
    return '0x24ee0097000000000000000000000000000000000000000000000000000000008bd02b7b0000000000000000000000000000000000000000000000000000000000000040000000000000000000000000000000000000000000000000000000000000000748656c6c6f212500000000000000000000000000000000000000000000000000'
  }
}
