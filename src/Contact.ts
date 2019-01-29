import { User } from './User'
import { Utils } from './Utils'

export class Contact {
  private relayApiUrl: string
  private user: User
  private utils: Utils

  constructor(relayApiUrl: string, user: User, utils: Utils) {
    this.relayApiUrl = relayApiUrl
    this.user = user
    this.utils = utils
  }

  public getAll(networkAddress: string): Promise<string[]> {
    const url = `${this.relayApiUrl}/networks/${networkAddress}/users/${
      this.user.address
    }/contacts`
    return this.utils.fetchUrl(url)
  }

  public createLink(address: string, username: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = ['contact', address, username]
      resolve(this.utils.createLink(params))
    })
  }
}
