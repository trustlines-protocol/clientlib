import { CurrencyNetwork } from './CurrencyNetwork'
import { User } from './User'
import { Utils } from './Utils'

import { Observable } from 'rxjs/Observable'

export class Messaging {
  constructor(
    private user: User,
    private utils: Utils,
    private currencyNetwork: CurrencyNetwork
  ) {}

  public paymentRequest(
    network: string,
    user: string,
    value: number | string,
    subject?: string
  ) {
    const headers = new Headers({
      'Content-Type': 'application/json'
    })
    return this.currencyNetwork.getDecimals(network).then(dec => {
      const type = 'PaymentRequest'
      const options = {
        body: JSON.stringify({
          message: `{
            "type": "${type}",
            "networkAddress": "${network}",
            "from": "${this.user.address}",
            "to": "${user}",
            "direction": "received",
            "user": "${user}",
            "counterParty": "${this.user.address}",
            "amount": "${this.utils
              .calcRaw(value, dec.networkDecimals)
              .toString()}",
            "subject": "${subject}",
            "nonce": "${this.utils.generateRandomNumber(40)}"
          }`,
          type // (optional) hint for notifications
        }),
        headers,
        method: 'POST'
      }
      return this.utils.fetchUrl(`messages/${user}`, options)
    })
  }

  public messageStream(): Observable<any> {
    return this.utils
      .websocketStream('streams/messages', 'listen', {
        type: 'all',
        user: this.user.address
      })
      .mergeMap(data => {
        if (data.type) {
          return [data]
        }
        const message = {
          ...JSON.parse(data.message),
          timestamp: data.timestamp
        }
        return this.currencyNetwork
          .getDecimals(message.networkAddress)
          .then(({ networkDecimals, interestRateDecimals }) =>
            this.utils.formatEvent(
              message,
              networkDecimals,
              interestRateDecimals
            )
          )
      })
  }
}
