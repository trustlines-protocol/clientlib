import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'
import { PaymentOptions } from './typings'

export class Payment {

  private validParameters = [ 'fromBlock', 'toBlock' ]

  constructor (private event: Event,
               private user: User,
               private utils: Utils,
               private transaction: Transaction,
               private currencyNetwork: CurrencyNetwork) {
  }

  public prepare (
    network: string,
    to: string,
    value: number | string,
    { decimals, maximumHops, maximumFees, gasPrice, gasLimit }: PaymentOptions = {}
  ): Promise<any> {
    const { user, currencyNetwork, transaction, utils } = this
    return currencyNetwork.getDecimals(network, decimals)
      .then(dec => {
        return this.getPath(network, user.address, to, value, {
          decimals: dec, maximumHops, maximumFees, gasPrice, gasLimit
        })
          .then(({ path, maxFees, estimatedGas }) => {
            return path.length > 0
              ? transaction.prepFuncTx(
                user.address,
                network,
                'CurrencyNetwork',
                'transfer',
                [ to, utils.calcRaw(value, dec), maxFees.raw, path.slice(1) ],
                {
                  gasPrice,
                  gasLimit: estimatedGas
                }
              ).then(({ rawTx, gasPrice, ethFees }) => ({
                rawTx,
                path,
                maxFees,
                ethFees
              }))
              : Promise.reject('Could not find a path with enough capacity')
          })
      })
      .catch(e => Promise.reject(`There was an error while finding a path: ${e}`))
  }

  public prepareEth (
    to: string,
    value: number | string,
    { gasPrice, gasLimit }: PaymentOptions = {}
  ): Promise<any> {
    const { transaction, user, utils } = this
    const rawValue = utils.convertEthToWei(value)
    return transaction.prepValueTx(user.address, to, rawValue, { gasPrice, gasLimit })
      .catch(error => Promise.reject(error))
  }

  public getPath (
    network: string,
    accountA: string,
    accountB: string,
    value: number | string,
    { decimals, maximumHops, maximumFees, gasPrice, gasLimit }: PaymentOptions = {}
  ): Promise<any> {
    const { utils, currencyNetwork } = this
    const url = `networks/${network}/path-info`
    return currencyNetwork.getDecimals(network, decimals)
      .then(dec => {
        const data = {
          from: accountA,
          to: accountB,
          value: utils.calcRaw(value, dec)
        }
        if (maximumFees) {
          data['maxFees'] = maximumFees
        }
        if (maximumHops) {
          data['maxHops'] = maximumHops
        }
        return utils.fetchUrl(url, {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(data)
        })
        .then(({ estimatedGas, fees, path }) => ({
          estimatedGas,
          path,
          maxFees: utils.formatAmount(fees, dec)
        }))
        .catch(e => Promise.reject(e))
      })
  }

  public get (networkAddress: string, filter?: object): Promise<any> {
    const mergedFilter = Object.assign({ type: 'Transfer' }, filter)
    return this.event.get(networkAddress, mergedFilter)
  }

  public confirm (rawTx): Promise<string> {
    return this.user.signTx(rawTx).then(signedTx => this.transaction.relayTx(signedTx))
  }

  public createRequest (network: string, amount: number, subject: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = [ 'paymentrequest', network, this.user.address, amount, subject ]
      resolve(this.utils.createLink(params))
    })
  }

  public issueCheque (network: string,
                      value: number,
                      expiresOn: number,
                      to: string // TODO receiver address optional?
  ): Promise<any> {
    const msg = this.user.address + to + value + expiresOn
    return this.user.signMsg(msg).then(signature => {
      const params = [ 'cheque', network, value, expiresOn, signature ]
      if (to) {
        params.push(to)
      }
      return this.utils.createLink(params)
    })
  }

  public prepCashCheque (network: string,
                         value: number,
                         expiresOn: number,
                         to: string,
                         signature: string): Promise<any> {
    return this.transaction.prepFuncTx(
      this.user.address,
      network,
      'CurrencyNetwork',
      'cashCheque',
      [ this.user.address, to, value, expiresOn, signature ]
    )
  }

  public confirmCashCheque (rawTx: any): Promise<string> {
    return this.user.signTx(rawTx).then(signedTx => this.transaction.relayTx(signedTx))
  }

  public getCashedCheques (network: string, filter?: object): Promise<any> {
    const mergedFilter = Object.assign({ type: 'ChequeCashed' }, filter)
    return this.event.get(network, mergedFilter)
      .then(transfers =>
        transfers.map(t =>
          Object.assign({}, { blockNumber: t.blockNumber }, t.event)))
      .catch(error => {
        return Promise.reject(error)
      })
  }
}
