import { Utils } from './Utils'
import { User } from './User'
import { CurrencyNetwork } from './CurrencyNetwork'

import { Observable } from 'rxjs/Observable'

export class Messaging {
  constructor (private user: User, private utils: Utils, private currencyNetwork: CurrencyNetwork) {
  }

  public paymentRequest (network: string,
                         user: string,
                         value: number) {
    const headers = new Headers({
      'Content-Type': 'application/json'
    })
    return this.currencyNetwork.getDecimals(network)
      .then(dec => {

        const options = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: `{
              "type": "PaymentRequest",
              "networkAddress": "${network}",
              "from": "${this.user.address}",
              "to": "${user}",
              "direction": "received",
              "address": "${this.user.address}",
              "amount": "${this.utils.calcRaw(value, dec)}"
              }`
          })
        }
        return this.utils.fetchUrl(`messages/${user}`, options)
      })
  }

  public messageStream (): Observable<any> {
    const {user, utils} = this
    return this.utils.websocketStream('streams/messages', 'listen', {'type': 'all', 'user': user.address})
      .mergeMap(data => {
        let message = {...JSON.parse(data.message), timestamp: data.timestamp}
        return this.currencyNetwork.getDecimals(message.networkAddress).then(
          decimals => utils.formatEvent(message, decimals))
      })
  }

}
