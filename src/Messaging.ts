import { Utils } from './Utils'
import { User } from './User'
import { CurrencyNetwork } from './CurrencyNetwork'
import { BigNumber } from 'bignumber.js'

import { Observable } from 'rxjs/Observable'

export class Messaging {
  constructor (private user: User, private utils: Utils, private currencyNetwork: CurrencyNetwork) {
  }

  public paymentRequest (network: string,
                         user: string,
                         value: number | string,
                         subject?: string) {
    const headers = new Headers({
      'Content-Type': 'application/json'
    })
    return this.currencyNetwork.getDecimals(network)
      .then(dec => {
        const type = "PaymentRequest"
        const options = {
          method: 'POST',
          headers,
          body: JSON.stringify({
            message: `{
              "type": "${type}",
              "networkAddress": "${network}",
              "from": "${this.user.address}",
              "to": "${user}",
              "direction": "received",
              "user": "${user}",
              "counterParty": "${this.user.address}",
              "amount": "${this.utils.calcRaw(value, dec).toString()}",
              "subject": "${subject}",
              "nonce": "${this.utils.generateRandomNumber(40)}"
              }`,
            type: type,  // (optional) hint for notifications
          })
        }
        return this.utils.fetchUrl(`messages/${user}`, options)
      })
  }

  public messageStream (): Observable<any> {
    const { user, utils } = this
    return this.utils.websocketStream('streams/messages', 'listen', { 'type': 'all', 'user': user.address })
      .mergeMap(data => {
        if (data.type) {
          return [ data ]
        }
        let message = { ...JSON.parse(data.message), timestamp: data.timestamp }
        return this.currencyNetwork.getDecimals(message.networkAddress).then(
          decimals => utils.formatEvent(message, decimals))
      })
  }

}
