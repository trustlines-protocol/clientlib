import { CurrencyNetwork } from './CurrencyNetwork'
import { User } from './User'
import { Utils } from './Utils'

import { Observable } from 'rxjs/Observable'

export class Messaging {
  private user: User
  private utils: Utils
  private currencyNetwork: CurrencyNetwork
  private relayApiUrl: string
  private relayWsApiUrl: string

  constructor(
    user: User,
    utils: Utils,
    currencyNetwork: CurrencyNetwork,
    relayApiUrl: string,
    relayWsApiUrl: string
  ) {
    this.user = user
    this.utils = utils
    this.currencyNetwork = currencyNetwork
    this.relayApiUrl = relayApiUrl
    this.relayWsApiUrl = relayWsApiUrl
  }

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
      return this.utils.fetchUrl(
        `${this.relayApiUrl}/messages/${user}`,
        options
      )
    })
  }

  public messageStream(): Observable<any> {
    return this.utils
      .websocketStream(`${this.relayWsApiUrl}/streams/messages`, 'listen', {
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
