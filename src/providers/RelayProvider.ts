import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import utils from '../utils'

import { TLProvider } from './TLProvider'

import {
  Amount,
  MetaTransaction,
  MetaTransactionFees,
  MetaTransactionStatus,
  TransactionStatusObject,
  TxInfos,
  TxInfosRaw
} from '../typings'

import { Provider } from './Provider'

export class RelayProvider extends Provider implements TLProvider {
  constructor(relayApiUrl: string, relayWsApiUrl: string) {
    super(relayApiUrl, relayWsApiUrl)
  }

  /**
   * Returns needed information for creating an ethereum transaction.
   * @param address Address of user creating the transaction
   * @returns Information for creating an ethereum transaction for the given user address.
   *          See type `TxInfos` for more details.
   */
  public async getTxInfos(address: string): Promise<TxInfos> {
    const { nonce, gasPrice, balance } = await this.fetchEndpoint<TxInfosRaw>(
      `users/${address}/txinfos`
    )
    return {
      balance: new BigNumber(balance),
      gasPrice: new BigNumber(gasPrice),
      nonce
    }
  }

  /**
   * Returns next nonce for identity with given address
   * @param address Address of identity
   * @returns the next nonce that should be used for making a meta-transaction
   */
  public async getIdentityNonce(address: string): Promise<number> {
    const {
      identity,
      nextNonce,
      balance,
      implementationAddress
    } = await this.fetchEndpoint<any>(`/identities/${address}`)
    return nextNonce
  }

  /**
   * Returns implementation address of identity with given address
   * @param address Address of identity
   * @returns the implementation address currently in use by the given identity
   */
  public async getIdentityImplementationAddress(
    address: string
  ): Promise<string> {
    const {
      identity,
      nextNonce,
      balance,
      implementationAddress
    } = await this.fetchEndpoint<any>(`/identities/${address}`)
    return implementationAddress
  }

  /**
   * Returns the fees the provider would be willing to pay for the transaction
   * @param metaTransaction Meta transaction to be relayed
   * @returns The fees value and currency network of fees for given meta transaction
   */
  public async getMetaTxFees(
    metaTransaction: MetaTransaction
  ): Promise<MetaTransactionFees> {
    const potentialDelegationFees = await this.postToEndpoint<any>(
      `/meta-transaction-fees`,
      {
        metaTransaction
      }
    )
    if (potentialDelegationFees.length === 0) {
      throw new Error('This relay provider does not accept any fees.')
    }
    return potentialDelegationFees[0]
  }

  public async getMetaTxStatus(
    identityAddress: string,
    metaTransactionHash: string
  ): Promise<MetaTransactionStatus> {
    return this.fetchEndpoint<TransactionStatusObject>(
      `/identities/${identityAddress}/meta-transactions/${metaTransactionHash}/status`
    )
  }

  public async getTxStatus(
    transactionHash: string
  ): Promise<TransactionStatusObject> {
    return this.fetchEndpoint<TransactionStatusObject>(
      `/transactions/${transactionHash}/status`
    )
  }

  /**
   * Returns balance of given address.
   * @param address Address to determine balance for.
   */
  public async getBalance(address: string): Promise<Amount> {
    const balance = await this.fetchEndpoint<string>(`users/${address}/balance`)
    return utils.formatToAmount(balance, 18)
  }

  /**
   * Send the given _signedTransaction_ to a relay server to execute it on the
   * blockchain and returns a `Promise` with the transaction hash.
   * @param signedTransaction
   */
  public async sendSignedTransaction(
    signedTransaction: string
  ): Promise<string> {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const options = {
      body: JSON.stringify({
        rawTransaction: ethers.utils.hexlify(signedTransaction)
      }),
      headers,
      method: 'POST'
    }
    return this.fetchEndpoint<string>(`relay`, options)
  }

  /**
   * Send the given signed meta-transaction to a relay server to execute it on the
   * blockchain and returns a `Promise` with the transaction hash.
   * @param signedMetaTransaction Signed meta-transaction to be sent to the relay server
   * @returns The hash of the transaction sent by the relay server, not to be confused with the hash of the meta-transaction
   */
  public async sendSignedMetaTransaction(
    signedMetaTransaction: MetaTransaction
  ): Promise<string> {
    return this.postToEndpoint<string>('relay-meta-transaction', {
      metaTransaction: signedMetaTransaction
    })
  }
}
