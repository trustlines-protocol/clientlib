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
   * @param network Address of a currency network.
   * @param to Address of receiver of transfer.
   * @param value Amount to transfer in biggest unit,
   *              i.e. 1.5 if currency network has 2 decimals.
   * @param options Payment options. See `PaymentOptions` for more information.
   * @param options.decimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user is willing to pay.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public async prepare (
    network: string,
    to: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<TLTxObject> {
    try {
      const { _user, _currencyNetwork, _transaction, _utils } = this
      let { decimals } = options
      decimals = await _currencyNetwork.getDecimals(network, decimals)
      const { path, maxFees, estimatedGas } = await this.getPath(
        network,
        _user.address,
        to,
        value,
        { ...options, decimals }
      )
      if (path.length > 0) {
        const { rawTx, ethFees } = await _transaction.prepFuncTx(
          _user.address,
          network,
          'CurrencyNetwork',
          'transfer',
          [ to, _utils.calcRaw(value, decimals), maxFees.raw, path.slice(1) ],
          {
            gasPrice: options.gasPrice,
            gasLimit: options.gasLimit || estimatedGas * 1.5
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
   * Prepares a tx object for a ETH transfer, where loaded user is the sender.
   * @param to Address of receiver of transfer.
   * @param value Amount of ETH to transfer.
   * @param options Payment options. See `PaymentOptions` for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public prepareEth (
    to: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<TxObject> {
    return this._transaction.prepValueTx(
      this._user.address,
      to,
      this._utils.calcRaw(value, 18),
      options
    )
  }

  /**
   * Returns a path for a trustlines transfer.
   * @param network Address of a currency network.
   * @param accountA Address of sender of transfer.
   * @param accountB Address of receiver of transfer.
   * @param value Amount to transfer in biggest unit,
   *              i.e. 1.23 if currency network has 2 decimals.
   * @param options Payment options. See `PaymentOptions` for more information.
   * @param options.decimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user if willing to pay.
   */
  public async getPath (
    network: string,
    accountA: string,
    accountB: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<PathObject> {
    try {
      const { _currencyNetwork, _utils, _user } = this
      let { decimals, maximumHops, maximumFees} = options
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
   * @param network Address of currency network.
   * @param filter Event filter object. See `EventFilterOptions` for more information.
   */
  public get (
    network: string,
    filter: EventFilterOptions = {}
  ): Promise<TLEvent[]> {
    return this._event.get(network, {
      ...filter,
      type: 'Transfer'
    })
  }

  /**
   * Signs and relays a raw transaction as returned by `prepare`.
   * @param rawTx RLP encoded hex string defining the transaction.
   */
  public async confirm (rawTx): Promise<string> {
    try {
      const signedTx = await this._user.signTx(rawTx)
      return this._transaction.relayTx(signedTx)
    } catch (error) {
      return Promise.reject(error)
    }
  }

  /**
   * Creates a payment request link.
   * @param network Address of a currency network.
   * @param amount Requested transfer amount.
   * @param subject Additional information for payment request.
   */
  public createRequest (
    network: string,
    amount: number,
    subject: string
  ): Promise<string> {
    return new Promise(resolve => {
      const params = [ 'paymentrequest', network, this._user.address, amount, subject ]
      resolve(this._utils.createLink(params))
    })
  }

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
