import { AddressZero } from '@ethersproject/constants'
import { SafeRelayProvider } from '../../src/providers/SafeRelayProvider'
import {
  Amount,
  SafeMetaTransaction,
  SafeTransactionFees,
  TransactionStatus,
  TransactionStatusObject
} from '../../src/typings'
import {
  FAKE_SAFE_RELAY_API,
  FAKE_TX_HASH,
  identityImplementationAddress,
  USER_1_SAFE_ADDRESS
} from '../Fixtures'

export class FakeSafeRelayProvider extends SafeRelayProvider {
  public errors: any = {}

  constructor() {
    super(FAKE_SAFE_RELAY_API, FAKE_SAFE_RELAY_API)
  }

  public async plainFetch(endpoint: string) {
    let response

    switch (endpoint) {
      case `v1/safes/${USER_1_SAFE_ADDRESS}/`:
        response = {
          status: 200,
          json: () =>
            Promise.resolve({
              address: USER_1_SAFE_ADDRESS,
              nonce: 0
            })
        }
        break
      case `v1/safes/${USER_1_SAFE_ADDRESS}`:
        response = {
          status: 200,
          json: () =>
            Promise.resolve({
              nonce: 0
            })
        }
        break
    }

    return Promise.resolve(response)
  }

  /**
   * Returns a JSON response from the REST API of the server.
   *
   * We overload this method since the safe relay server from gnosis doesn't like
   * urls with a trimmed slash at the end.
   *
   * @param endpoint Endpoint to fetch.
   * @param options Optional fetch options.
   */
  public async fetchEndpoint<T>(
    endpoint: string,
    options?: object
  ): Promise<T> {
    let response

    if (this.errors.fetchUrl) {
      throw new Error('Mocked error in fetchUrl | Status 404')
    }

    switch (endpoint) {
      case 'v3/safes/':
        response = {
          safe: USER_1_SAFE_ADDRESS
        }
        break
      case 'v1/safes/0x02F059E11701276760b7DC8588E4A2f5dED195c9':
        console.log('endpoint', endpoint)
        response = {
          status: 404
        }
        break
      default:
        break
    }
    return Promise.resolve(response)
  }

  public async getSafeNonce(safeAddress: string): Promise<number> {
    const response = await this.plainFetch(`v1/safes/${safeAddress}/`)

    if (response.status === 200) {
      const json = await response.json()
      return json.nonce
    }

    throw new Error(`Error fetching safe nonce: ${response.status}`)
  }

  /**
   * Returns the fees the provider would be willing to pay for the transaction
   * @param metaTransaction Meta transaction to be relayed
   * @returns The fees value and currency network of fees for given meta transaction
   */
  public async getMetaTxFees(
    metaTransaction: SafeMetaTransaction
  ): Promise<SafeTransactionFees> {
    return {
      safeTxGas: '100000',
      baseGas: '0',
      gasPrice: '0',
      refundReceiver: AddressZero,
      gasToken: AddressZero
    }
  }

  /**
   * Send the given signed meta-transaction to a relay server to execute it on the
   * blockchain and returns a `Promise` with the transaction hash.
   * @param signedMetaTransaction Signed meta-transaction to be sent to the relay server
   * @returns The hash of the transaction sent by the relay server, not to be confused with the hash of the meta-transaction
   */
  public async sendSignedMetaTransaction(
    signedMetaTransaction: SafeMetaTransaction
  ): Promise<any> {
    return Promise.resolve(FAKE_TX_HASH)
  }

  /**
   * Returns implementation address of identity with given address
   * @param address Address of identity
   * @returns the implementation address currently in use by the given identity
   */
  public async getIdentityImplementationAddress(
    address: string
  ): Promise<string> {
    return Promise.resolve(identityImplementationAddress)
  }

  public async getMetaTxStatus(
    safeAddress: string,
    transactionHash: string
  ): Promise<TransactionStatusObject> {
    return { status: TransactionStatus.Success }
  }

  /**
   * Returns balance of given address.
   * @param address Address to determine balance for.
   */
  public async getBalance(address: string): Promise<Amount> {
    if (this.errors.getBalance) {
      throw new Error('Mocked error in provider.getBalance()')
    }
    return Promise.resolve({
      decimals: 18,
      raw: '1000000000000000000',
      value: '1'
    })
  }
}
