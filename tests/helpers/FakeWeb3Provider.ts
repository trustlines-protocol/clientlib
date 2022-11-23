import { BigNumber } from '@ethersproject/bignumber'
import { ethers } from 'ethers'
import {
  FAKE_ETHERS_TX_RESPONSE,
  FAKE_SIGNED_MESSAGE,
  FAKE_WEB3_TX_INFOS,
  USER_1
} from '../Fixtures'

/**
 * This class mocks a web3 provider used for testing purposes.
 */
export class FakeWeb3Provider extends ethers.providers.Web3Provider {
  constructor() {
    super({
      host: 'http://fake.host',
      isMetaMask: false,
      path: '/path',
      send: (request: any, callback: (error: any, response: any) => void) => '',
      sendAsync: (
        request: any,
        callback: (error: any, response: any) => void
      ) => Promise.resolve()
    })
  }

  public getSigner(): any {
    return {
      getAddress: async (): Promise<string> => USER_1.address,
      getBalance: async (): Promise<BigNumber> => BigNumber.from('1000000000'),
      sendTransaction: async (): Promise<
        ethers.providers.TransactionResponse
      > => FAKE_ETHERS_TX_RESPONSE,
      signMessage: async (): Promise<string> => FAKE_SIGNED_MESSAGE
    }
  }

  public getBalance(addressOrName: string): Promise<BigNumber> {
    return Promise.resolve<BigNumber>(FAKE_WEB3_TX_INFOS.balance)
  }

  public getTransactionCount(addressOrName: string): Promise<number> {
    return Promise.resolve<number>(FAKE_WEB3_TX_INFOS.nonce)
  }

  public getGasPrice(): Promise<BigNumber> {
    return Promise.resolve<BigNumber>(FAKE_WEB3_TX_INFOS.gasPrice)
  }
}
