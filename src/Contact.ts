import { TLProvider } from './providers/TLProvider'
import { User } from './User'

import { createLink } from './utils'

export class Contact {
  private user: User
  private provider: TLProvider

  constructor(params: { user: User; provider: TLProvider }) {
    this.user = params.user
    this.provider = params.provider
  }

  public getAll(networkAddress: string): Promise<string[]> {
    const endpoint = `networks/${networkAddress}/users/${
      this.user.address
    }/contacts`
    return this.provider.fetchEndpoint(endpoint)
  }

  public createLink(address: string, username: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = ['contact', address, username]
      resolve(createLink(params))
    })
  }
}
