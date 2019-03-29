import { TLProvider } from './providers/TLProvider'
import { User } from './User'

import utils from './utils'

export class Contact {
  private user: User
  private provider: TLProvider

  constructor(params: { user: User; provider: TLProvider }) {
    this.user = params.user
    this.provider = params.provider
  }

  public async getAll(networkAddress: string): Promise<string[]> {
    const endpoint = `networks/${networkAddress}/users/${await this.user.getAddress()}/contacts`
    return this.provider.fetchEndpoint<string[]>(endpoint)
  }

  public async createLink(address: string, username: string): Promise<string> {
    const params = ['contact', address, username]
    return utils.createLink(params)
  }
}
