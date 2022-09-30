import { AddressZero } from '@ethersproject/constants'
import { ZERO_ADDRESS } from '@gnosis.pm/safe-core-sdk/dist/src/utils/constants'
import { ethers } from 'ethers'
import {
  EstimationResponse,
  MetaTransaction,
  MetaTransactionFees,
  SafeMetaTransaction,
  SafeTransactionFees
} from '../typings'
import utils from '../utils'
import { Provider } from './Provider'

export class SafeRelayProvider extends Provider {
  public ApiUrl: string
  public WsApiUrl: string

  public async plainFetch(endpoint: string) {
    const response = await fetch(`${this.ApiUrl}/${endpoint}`)
    return response
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
    return utils.fetchUrl<T>(`${this.ApiUrl}/${endpoint}`, options)
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
    const data = {
      safe: metaTransaction.safe,
      to: metaTransaction.to,
      value: metaTransaction.value,
      data: metaTransaction.data,
      operation: metaTransaction.operation
    }

    const response: EstimationResponse = await this.postToEndpoint(
      `v2/safes/${metaTransaction.safe}/transactions/estimate/`,
      data
    )

    return {
      safeTxGas: response.safeTxGas,
      baseGas: response.baseGas,
      gasPrice: response.gasPrice,
      refundReceiver: response.refundReceiver,
      gasToken: response.gasToken || AddressZero
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
    const response: any = await this.postToEndpoint(
      `v1/safes/${signedMetaTransaction.safe}/transactions/`,
      signedMetaTransaction
    )

    return response.txHash
  }

  /**
   * Returns implementation address of identity with given address
   * @param address Address of identity
   * @returns the implementation address currently in use by the given identity
   */
  public async getIdentityImplementationAddress(
    address: string
  ): Promise<string> {
    const { masterCopy } = await this.fetchEndpoint<any>(`v1/safes/${address}`)
    return masterCopy
  }
}
