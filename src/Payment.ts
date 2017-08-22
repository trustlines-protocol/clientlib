import { Event } from './Event'
import { Utils } from './Utils'
import { User } from './User'
import { Transaction } from './Transaction'

export class Payment {

  private validParameters = [ 'fromBlock', 'toBlock' ]

  constructor (private event: Event,
               private user: User,
               private utils: Utils,
               private transaction: Transaction) {
  }

  public prepare (networkAddress: string, receiver: string, value: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getPath(networkAddress, this.user.address, receiver, value)
      .then(response => {
        if (response.path.length > 0) {
          Promise.all([
            this.transaction.prepFuncTx(
              this.user.proxyAddress,
              networkAddress,
              'CurrencyNetwork',
              'prepare',
              [ receiver, response.maxFee, response.path.slice(1) ]
            ),
            this.transaction.prepFuncTx(
              this.user.proxyAddress,
              networkAddress,
              'CurrencyNetwork',
              'transfer',
              [ receiver, value, response.maxFee, response.path.slice(1) ],
              true // TODO used to get right nonce
            )
          ]).then(txs => {
            resolve({
              rawPrepTx: txs[0].rawTx,
              rawTransferTx: txs[1].rawTx,
              ethFees: txs[0].ethFees + txs[1].ethFees,
              maxFee: response.maxFee,
              path: response.path
            })
          })
        } else {
          reject('Could not find a path with enough capacity')
        }
      })
    })
  }

  public getPath (network: string, accountA: string, accountB: string, value: number): Promise<any> {
    const url = `networks/${network}/users/${accountA}/path/${accountB}/${value}`
    return this.utils.fetchUrl(url)
  }

  public get (network: string, filter?: object): Promise<object> {
    const mergedFilter = Object.assign({ type: 'Transfer' }, filter)
    return this.event.get(network, mergedFilter)
  }

  public confirm (network: string, receiver: string, rawPrepTx: string, rawTransTx: string): Promise<string> {
    return this.user.signTx(rawPrepTx).then(signedTx =>
      this.transaction.relayTx(signedTx)).then(() =>
      this.transaction.getBlockNumber()).then(res =>
        this.checkPathPrepared(network, receiver, rawTransTx, res.blocknumber))
  }

  private checkPathPrepared (
    network: string,
    receiver: string,
    transferTx: string,
    blockNumber: number
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const sub = this.event.createObservable(network, {type: 'PathPrepared', fromBlock: blockNumber - 5}).subscribe(events => {
        if (events.length > 0) {
          const latest = events[events.length - 1]
          if ((latest.blockNumber >= blockNumber) && (latest._receiver === receiver)) {
            sub.unsubscribe()
            this.user.signTx(transferTx).then(signedTx =>
              this.transaction.relayTx(signedTx)
            ).then((txId) => resolve(txId))
          }
        }
      })
    })
  }

  public createRequest (network: string, amount: number, subject: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = [ network, this.user.proxyAddress, amount, subject ]
      resolve(this.utils.createLink('paymentrequest', params))
    })
  }

  public issueCheque (network: string,
                      value: number,
                      expiresOn: number,
                      to: string // TODO receiver address optional?
  ): Promise<any> {
    const msg = this.user.proxyAddress + to + value + expiresOn
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
      this.user.proxyAddress,
      network,
      'CurrencyNetwork',
      'cashCheque',
      [ this.user.proxyAddress, to, value, expiresOn, signature ]
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
  }

}
