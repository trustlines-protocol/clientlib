import { Observable } from 'rxjs/Observable'
import { fromPromise } from 'rxjs/observable/fromPromise'

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

  public async paymentRequest(
    networkAddress: string,
    counterPartyAddress: string,
    value: number | string,
    subject?: string
  ) {
    const headers = new Headers({
      'Content-Type': 'application/json'
    })
    const decimals = await this.currencyNetwork.getDecimals(networkAddress)
    const type = 'PaymentRequest'
    const options = {
      body: JSON.stringify({
        message: `{
          "type": "${type}",
          "networkAddress": "${networkAddress}",
          "from": "${await this.user.getAddress()}",
          "to": "${counterPartyAddress}",
          "direction": "received",
          "user": "${counterPartyAddress}",
          "counterParty": "${await this.user.getAddress()}",
          "amount": "${utils
            .calcRaw(value, decimals.networkDecimals)
            .toString()}",
          "subject": "${subject}",
          "nonce": "${utils.generateRandomNumber(40)}"
        }`,
        type // (optional) hint for notifications
      }),
      headers,
      method: 'POST'
    }
    return this.provider.fetchEndpoint(
      `messages/${counterPartyAddress}`,
      options
    )
  }

  public messageStream(): Observable<any> {
    return fromPromise(this.user.getAddress()).flatMap(userAddress =>
      this.provider
        .createWebsocketStream(`/streams/messages`, 'listen', {
          type: 'all',
          user: userAddress
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
    )
  }
}
