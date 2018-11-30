import BigNumber from 'bignumber.js'

import { Transaction } from './Transaction'
import { User } from './User'
import { Utils } from './Utils'

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
  private user: User
  private utils: Utils
  private transaction: Transaction

  constructor(user: User, utils: Utils, transaction: Transaction) {
    this.user = user
    this.utils = utils
    this.transaction = transaction
  }

  /**
   * Returns all known ETH wrapper contract addresses from the relay server.
   */
  public getAddresses(): Promise<string[]> {
    return this.utils.fetchUrl<string[]>('exchange/eth')
  }

  /**
   * Returns the amount of already wrapped ETH on the given ETH wrapper contract.
   * @param ethWrapperAddress Address of ETH wrapper contract.
   */
  public async getBalance(ethWrapperAddress: string): Promise<Amount> {
    const endpoint = `tokens/${ethWrapperAddress}/users/${
      this.user.address
    }/balance`
    const balance = await this.utils.fetchUrl<string>(endpoint)
    return this.utils.formatToAmount(balance, ETH_DECIMALS)
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
    const { rawTx, ethFees } = await this.transaction.prepFuncTx(
      this.user.address,
      ethWrapperAddress,
      'UnwEth',
      'transfer',
      [
        receiverAddress,
        this.utils.convertToHexString(this.utils.calcRaw(value, ETH_DECIMALS))
      ],
      {
        gasLimit: gasPrice ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      ethFees: this.utils.convertToAmount(ethFees),
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
    const { rawTx, ethFees } = await this.transaction.prepFuncTx(
      this.user.address,
      ethWrapperAddress,
      'UnwEth',
      'deposit',
      [],
      {
        gasLimit: gasPrice ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined,
        value: new BigNumber(this.utils.calcRaw(value, ETH_DECIMALS))
      }
    )
    return {
      ethFees: this.utils.convertToAmount(ethFees),
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
    const { rawTx, ethFees } = await this.transaction.prepFuncTx(
      this.user.address,
      ethWrapperAddress,
      'UnwEth',
      'withdraw',
      [this.utils.convertToHexString(this.utils.calcRaw(value, ETH_DECIMALS))],
      {
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      ethFees: this.utils.convertToAmount(ethFees),
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
    const baseUrl = `tokens/${ethWrapperAddress}/users/${
      this.user.address
    }/events`
    const events = await this.utils.fetchUrl<AnyTokenEventRaw[]>(
      this.utils.buildUrl(baseUrl, { type, fromBlock })
    )
    return events.map(event => this.utils.formatEvent(event, ETH_DECIMALS, 0))
  }
}
