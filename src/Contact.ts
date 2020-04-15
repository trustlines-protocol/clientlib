import { TLProvider } from './providers/TLProvider'
import { User } from './User'

import utils, { defaultBaseUrl } from './utils'

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

  /**
   * Creates sharable contact link.
   * @param address Address of contact to share.
   * @param options Optional
   *        options[key] - additional params that will be appended
   *        options.name - optional user name
   *        options.subject - optional message for the recipient of the request
   *        options.customBase - Optional custom base for link. Defaults to `trustlines://`.
   */
  public createLink(
    address: string,
    options?: {
      [key: string]: string
      subject?: string
      name?: string
      customBase?: string
    }
  ): string {
    const path = ['contact', address]
    const { customBase = defaultBaseUrl, ...rest } = options
    return utils.buildUrl(customBase, { path, query: rest })
  }
}
