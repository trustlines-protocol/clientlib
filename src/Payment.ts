import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'
import { CurrencyNetwork } from './CurrencyNetwork'

export class Payment {

  private validParameters = [ 'fromBlock', 'toBlock' ]

  constructor (private event: Event,
               private user: User,
               private utils: Utils,
               private transaction: Transaction,
               private currencyNetwork: CurrencyNetwork) {
  }

  public prepare (
    networkAddress: string,
    receiver: string,
    value: number,
    decimals: any = {},
    pathOptions: any = {}
  ): Promise<any> {
    const { user, currencyNetwork, transaction, utils } = this
    if (typeof decimals === 'object') {
      pathOptions = decimals
    }
    return currencyNetwork.getDecimals(networkAddress, decimals)
      .then(dec => {
        return this.getPath(networkAddress, user.address, receiver, value, dec, pathOptions)
          .then(({ path, maxFees, estimatedGas }) => {
            return path.length > 0
              ? transaction.prepFuncTx(
                  user.address,
                  networkAddress,
                  'CurrencyNetwork',
                  'transfer',
                  [ receiver, utils.calcRaw(value, dec), utils.calcRaw(maxFees, dec), path.slice(1) ]
                ).then(({ rawTx, gasPrice }) => ({
                  rawTx,
                  path,
                  maxFees,
                  ethFees: gasPrice * estimatedGas
                }))
              : Promise.reject('Could not find a path with enough capacity')
          })
      })
      .catch(e => Promise.reject(`There was an error while finding a path: ${e}`))
  }

  public getPath (
    network: string,
    accountA: string,
    accountB: string,
    value: number,
    decimals: any = {},
    pathOptions: any = {}
  ): Promise<any> {
    const { utils, currencyNetwork } = this
    const url = `networks/${network}/path-info`
    if (typeof decimals === 'object') {
      pathOptions = decimals
    }
    return currencyNetwork.getDecimals(network, decimals)
      .then(dec => {
        const { maxFees, maxHops } = pathOptions
        const data = {
          from: accountA,
          to: accountB,
          value: utils.calcRaw(value, dec)
        }
        if (maxFees) {
          data['maxFees'] = maxFees
        }
        if (maxHops) {
          data['maxHops'] = maxHops
        }
        return utils.fetchUrl(url, {
          method: 'POST',
          headers: new Headers({ 'Content-Type': 'application/json' }),
          body: JSON.stringify(data)
        })
        .then(({ estimatedGas, fees, path }) => ({
          estimatedGas,
          path,
          maxFees: utils.calcValue(fees, dec)
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
      const params = [ network, this.user.address, amount, subject ]
      resolve(this.utils.createLink('paymentrequest', params))
    })
  }

  public issueCheque (network: string,
                      value: number,
                      expiresOn: number,
                      to: string // TODO receiver address optional?
  ): Promise<any> {
    const msg = this.user.address + to + value + expiresOn
    return this.user.signMsg(msg).then(signature => {
      const params = [ network, value, expiresOn, signature ]
      if (to) { params.push(to) }
      return this.utils.createLink('cheque', params)
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

  public prepareEth (to: string, value: number, options?: object): Promise<any> {
    return this.transaction.prepValueTx(this.user.address, to, value, options)
      .catch(error => Promise.reject(error))
  }

}
