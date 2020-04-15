import BigNumber from 'bignumber.js'

import { TLProvider } from './providers/TLProvider'
import { Transaction } from './Transaction'
import { User } from './User'

import utils from './utils'

import {
  Amount,
  AnyTokenEvent,
  AnyTokenEventRaw,
  EventFilterOptions,
  RawTxObject,
  TxObject,
  TxOptions
} from './typings'

const ETH_DECIMALS = 18

/**
 * The class EthWrapper contains all methods for depositing, withdrawing and transferring wrapped ETH.
 */
export class EthWrapper {
  private provider: TLProvider
  private transaction: Transaction
  private user: User

  constructor(params: {
    provider: TLProvider
    transaction: Transaction
    user: User
  }) {
    this.provider = params.provider
    this.transaction = params.transaction
    this.user = params.user
  }

  /**
   * Returns all known ETH wrapper contract addresses from the relay server.
   */
  public getAddresses(): Promise<string[]> {
    return this.provider.fetchEndpoint<string[]>(`exchange/eth`)
  }

  /**
   * Returns the amount of already wrapped ETH on the given ETH wrapper contract.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   */
  public async getBalance(ethWrapperAddress: string): Promise<Amount> {
    const endpoint = `tokens/${ethWrapperAddress}/users/${await this.user.getAddress()}/balance`
    const balance = await this.provider.fetchEndpoint<string>(endpoint)
    return utils.formatToAmount(balance, ETH_DECIMALS)
  }

  /**
   * Prepares an ethereum transaction object for transferring wrapped ETH where the
   * loaded user is the sender.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   * @param receiverAddress Address of receiver of transfer.
   * @param value Amount of wrapped ETH to transfer.
   * @param options Transaction options. See `TxOptions` for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public async prepTransfer(
    ethWrapperAddress: string,
    receiverAddress: string,
    value: number | string,
    options: TxOptions = {}
  ): Promise<TxObject> {
    const { gasPrice, gasLimit } = options
    const { rawTx, txFees } = await this.transaction.prepareContractTransaction(
      await this.user.getAddress(),
      ethWrapperAddress,
      'UnwEth',
      'transfer',
      [
        receiverAddress,
        utils.convertToHexString(utils.calcRaw(value, ETH_DECIMALS))
      ],
      {
        gasLimit: gasPrice ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      txFees,
      rawTx
    }
  }

  /**
   * Prepares an ethereum transaction object for depositing/wrapping ETH.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   * @param value Amount of ETH to deposit/wrap.
   * @param options Transaction options. See `TxOptions` for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public async prepDeposit(
    ethWrapperAddress: string,
    value: number | string,
    options: TxOptions = {}
  ): Promise<TxObject> {
    const { gasPrice, gasLimit } = options
    const { rawTx, txFees } = await this.transaction.prepareContractTransaction(
      await this.user.getAddress(),
      ethWrapperAddress,
      'UnwEth',
      'deposit',
      [],
      {
        gasLimit: gasPrice ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        value: new BigNumber(utils.calcRaw(value, ETH_DECIMALS))
      }
    )
    return {
      txFees,
      rawTx
    }
  }

  /**
   * Prepares an ethereum transaction object for withdrawing/unwrapping ETH.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   * @param value Amount of ETH to withdraw/unwrap.
   * @param options Transaction options. See `TxOptions` for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public async prepWithdraw(
    ethWrapperAddress: string,
    value: number | string,
    options: TxOptions = {}
  ): Promise<TxObject> {
    const { gasPrice, gasLimit } = options
    const { rawTx, txFees } = await this.transaction.prepareContractTransaction(
      await this.user.getAddress(),
      ethWrapperAddress,
      'UnwEth',
      'withdraw',
      [utils.convertToHexString(utils.calcRaw(value, ETH_DECIMALS))],
      {
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      txFees,
      rawTx
    }
  }

  /**
   * Signs a raw transaction object as returned by `prepTransfer`, `prepDeposit` or `prepWithdraw`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    return this.transaction.confirm(rawTx)
  }

  /**
   * Returns event logs of the ETH wrapper contract for the loaded user.
   * @param ethWrapperAddress Address of the ETH wrapper contract.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   * @param filter.type Available event types are `Transfer`, `Deposit` and `Withdrawal`.
   * @param filter.fromBlock Start of block range for event logs.
   */
  public async getLogs(
    ethWrapperAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<AnyTokenEvent[]> {
    const { type, fromBlock } = filter
    const baseUrl = `tokens/${ethWrapperAddress}/users/${await this.user.getAddress()}/events`
    const events = await this.provider.fetchEndpoint<AnyTokenEventRaw[]>(
      utils.buildUrl(baseUrl, { query: { type, fromBlock } })
    )
    return events.map(event => utils.formatEvent(event, ETH_DECIMALS, 0))
  }
}
