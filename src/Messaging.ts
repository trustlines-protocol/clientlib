import { Observable } from 'rxjs/Observable'
import { fromPromise } from 'rxjs/observable/fromPromise'

import { CurrencyNetwork } from './CurrencyNetwork'
import { TLProvider } from './providers/TLProvider'
import { User } from './User'

import utils from './utils'

import { PaymentRequestEvent } from './typings'

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

  /**
   * Sends a payment request to given `counterParty` and returns created payment request.
   * @param networkAddress Address of currency network.
   * @param counterPartyAddress Address of counter party.
   * @param value Requested payment amount.
   * @param subject Optional subject of payment request.
   */
  public async paymentRequest(
    networkAddress: string,
    counterPartyAddress: string,
    value: number | string,
    subject?: string
  ): Promise<PaymentRequestEvent> {
    const decimals = await this.currencyNetwork.getDecimals(networkAddress)
    const type = 'PaymentRequest'
    const paymentRequest = {
      type,
      networkAddress,
      from: await this.user.getAddress(),
      to: counterPartyAddress,
      amount: utils.formatToAmount(
        utils.calcRaw(value, decimals.networkDecimals),
        decimals.networkDecimals
      ),
      subject,
      nonce: utils.generateRandomNumber(20).toNumber()
    }
    await this.provider.postToEndpoint(`messages/${counterPartyAddress}`, {
      type,
      message: JSON.stringify({
        ...paymentRequest,
        counterParty: await this.user.getAddress(),
        direction: 'received',
        user: counterPartyAddress
      })
    })
    return {
      ...paymentRequest,
      counterParty: counterPartyAddress,
      direction: 'sent',
      user: await this.user.getAddress()
    }
  }

  /**
   * Returns a websocket observable that can be subscribed to.
   */
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
          return Promise.resolve({
            ...JSON.parse(data.message),
            timestamp: data.timestamp
          })
        })
    )
  }
}
