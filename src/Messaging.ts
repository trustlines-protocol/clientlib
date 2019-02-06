import { Observable } from 'rxjs/Observable'

import { CurrencyNetwork } from './CurrencyNetwork'
import { TLProvider } from './providers/TLProvider'
import { User } from './User'

import utils from './utils'

export class Messaging {
  private user: User
  private currencyNetwork: CurrencyNetwork
  private provider: TLProvider

  constructor(params: {
    currencyNetwork: CurrencyNetwork
    provider: TLProvider
    user: User
  }) {
    this.user = params.user
    this.currencyNetwork = params.currencyNetwork
    this.provider = params.provider
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
            "amount": "${utils.calcRaw(value, dec.networkDecimals).toString()}",
            "subject": "${subject}",
            "nonce": "${utils.generateRandomNumber(40)}"
          }`,
          type // (optional) hint for notifications
        }),
        headers,
        method: 'POST'
      }
      return this.provider.fetchEndpoint(`messages/${user}`, options)
    })
  }

  public messageStream(): Observable<any> {
    return this.provider
      .createWebsocketStream(`/streams/messages`, 'listen', {
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
            utils.formatEvent(message, networkDecimals, interestRateDecimals)
          )
      })
  }
}
