import { User } from './User'
import { Utils } from './Utils'

export class Contact {
  constructor(private user: User, private utils: Utils) {}

  public getAll(networkAddress: string): Promise<string[]> {
    const { user, utils } = this
    const url = `networks/${networkAddress}/users/${user.address}/contacts`
    return utils.fetchUrl(url)
  }

  public createLink(address: string, username: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = ['contact', address, username]
      resolve(this.utils.createLink(params))
    })
  }
}
