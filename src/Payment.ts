import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import {
  TxObject,
  TLTxObject,
  PathObject,
  PathRaw,
  PaymentOptions,
  EventFilterOptions,
  TLEvent
} from './typings'

/**
 * The Payment class contains all payment related funcstion. This includes
 * trustline transfers and normal ETH transfers.
 */
export class Payment {
  private _event: Event
  private _user: User
  private _utils: Utils
  private _transaction: Transaction
  private _currencyNetwork: CurrencyNetwork

  constructor (
    event: Event,
    user: User,
    utils: Utils,
    transaction: Transaction,
    currencyNetwork: CurrencyNetwork
  ) {
    this._event = event
    this._user = user
    this._utils = utils
    this._transaction = transaction
    this._currencyNetwork = currencyNetwork
  }

  /**
   * Prepares tx object for a trustlines transfer, where loaded user is sender.
   * @param network address of currency network
   * @param to address of receiver of transfer
   * @param value amount to transfer in biggest unit,
   *              i.e. 1.5 if currency network has 2 decimals
   * @param decimals (optional) decimals of currency network can be provided manually
   * @param maximumHops (optional) max. number of hops for transfer
   * @param maximumFees (optional) max. transfer fees
   * @param gasPrice (optional)
   * @param gasLimit (optional)
   */
  public async prepare (
    network: string,
    to: string,
    value: number | string,
    { decimals, maximumHops, maximumFees, gasPrice, gasLimit }: PaymentOptions = {}
  ): Promise<TLTxObject> {
    try {
      const { _user, _currencyNetwork, _transaction, _utils } = this
      decimals = await _currencyNetwork.getDecimals(network, decimals)
      const { path, maxFees, estimatedGas } = await this.getPath(
        network,
        _user.address,
        to,
        value,
        { decimals, maximumHops, maximumFees, gasPrice, gasLimit }
      )
      if (path.length > 0) {
        const { rawTx, ethFees } = await _transaction.prepFuncTx(
          _user.address,
          network,
          'CurrencyNetwork',
          'transfer',
          [ to, _utils.calcRaw(value, decimals), maxFees.raw, path.slice(1) ],
          {
            gasPrice,
            gasLimit: gasLimit || estimatedGas * 1.5
          }
        )
        return { rawTx, path, maxFees, ethFees }
      } else {
        return Promise.reject('Could not find a path with enough capacity.')
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Prepares a tx object for a ether transfer, where loaded user is the sender.
   * @param to address of receiver of transfer
   * @param value amount of ether to transfer
   * @param gasPrice (optional)
   * @param gasLimit (optional)
   */
  public prepareEth (
    to: string,
    value: number | string,
    { gasPrice, gasLimit }: PaymentOptions = {}
  ): Promise<TxObject> {
    return this._transaction.prepValueTx(
      this._user.address,
      to,
      this._utils.calcRaw(value, 18),
      { gasPrice, gasLimit }
    )
  }

  /**
   * Returns a path for a trustlines transfer.
   * @param network address of currency network
   * @param accountA address of sender of transfer
   * @param accountB address of receiver of transfer
   * @param value transfer for amount
   * @param decimals (optional) decimals of currency network can be provided manually
   * @param maximumHops (optional) max. number of hops for transfer
   * @param maximumFees (optional) max. transfer fees
   */
  public async getPath (
    network: string,
    accountA: string,
    accountB: string,
    value: number | string,
    { decimals, maximumHops, maximumFees}: PaymentOptions = {}
  ): Promise<PathObject> {
    try {
      const { _currencyNetwork, _utils, _user } = this
      decimals = await _currencyNetwork.getDecimals(network, decimals)
      const data = {
        from: accountA,
        to: accountB,
        value: this._utils.calcRaw(value, decimals)
      }
      if (maximumFees) {
        data['maxFees'] = maximumFees
      }
      if (maximumHops) {
        data['maxHops'] = maximumHops
      }
      const endpoint = `networks/${network}/path-info`
      const { estimatedGas, fees, path } = await _utils.fetchUrl<PathRaw>(endpoint, {
        method: 'POST',
        headers: new Headers({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(data)
      })
      return {
        estimatedGas,
        path,
        maxFees: _utils.formatAmount(fees, decimals)
      }
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Returns transfer logs of loaded user in a specified currency network.
   * @param network address of currency network
   * @param fromBlock (optional) start of block range for query
   */
  public get (
    network: string,
    { fromBlock }: EventFilterOptions = {}
  ): Promise<TLEvent[]> {
    const filter = { type: 'Transfer' }
    if (fromBlock) {
      filter['fromBlock'] = fromBlock
    }
    return this._event.get(network, filter)
  }

  /**
   * Signs and relays a raw transaction.
   * @param rawTx rlp encoded hex string defining the transaction
   */
  public async confirm (rawTx): Promise<string> {
    try {
      const signedTx = await this._user.signTx(rawTx)
      return this._transaction.relayTx(signedTx)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  // public createRequest (network: string, amount: number, subject: string): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     const params = [ 'paymentrequest', network, this._user.address, amount, subject ]
  //     resolve(this._utils.createLink(params))
  //   })
  // }

  // public issueCheque (network: string,
  //                     value: number,
  //                     expiresOn: number,
  //                     to: string // TODO receiver address optional?
  // ): Promise<any> {
  //   const msg = this._user.address + to + value + expiresOn
  //   return this._user.signMsgHash(msg).then(signature => {
  //     const params = [ 'cheque', network, value, expiresOn, signature ]
  //     if (to) {
  //       params.push(to)
  //     }
  //     return this._utils.createLink(params)
  //   })
  // }

  // public prepCashCheque (network: string,
  //                        value: number,
  //                        expiresOn: number,
  //                        to: string,
  //                        signature: string): Promise<any> {
  //   return this._transaction.prepFuncTx(
  //     this._user.address,
  //     network,
  //     'CurrencyNetwork',
  //     'cashCheque',
  //     [ this._user.address, to, value, expiresOn, signature ]
  //   )
  // }

  // public confirmCashCheque (rawTx: any): Promise<string> {
  //   return this._user.signTx(rawTx).then(signedTx => this._transaction.relayTx(signedTx))
  // }

  // public getCashedCheques (network: string, filter?: object): Promise<any> {
  //   const mergedFilter = Object.assign({ type: 'ChequeCashed' }, filter)
  //   return this._event.get(network, mergedFilter)
  //     .then(transfers =>
  //       transfers.map(t =>
  //         Object.assign({}, { blockNumber: t.blockNumber }, t.event)))
  //     .catch(error => {
  //       return Promise.reject(error)
  //     })
  // }
}
