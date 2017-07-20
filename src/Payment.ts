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
    return this.getPath(networkAddress, this.user.address, receiver, value)
      .then((response) => {
        if (response.path.length > 0) {
          return this.transaction.prepare(
            networkAddress,
            'mediatedTransfer',
            [ receiver, value, response.path.slice(1) ]
          )
        } else {
          return Promise.reject<string>('Could not find a path with enough capacity')
        }
      })
  }

  public getPath (network: string, accountA: string, accountB: string, value: number): Promise<any> {
    const url = `networks/${network}/users/${accountA}/path/${accountB}`
    return this.utils.fetchUrl(url)
  }

  public get (network: string, filter?: object): Promise<object> {
    const mergedFilter = Object.assign({type: 'Transfer'}, filter)
    return this.event.get(network, mergedFilter)
      .then(transfers => transfers.map(t => Object.assign({}, {blockNumber: t.blockNumber}, t.event)))
  }

}
