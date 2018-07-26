import { User } from '../../src/User'

/**
 * Mock User class
 */
export class FakeUser extends User {
  /**
   * Mock user.signTx and return signed tx.
   */
  public signTx (rlpHexTx: string): Promise<string> {
    return Promise.resolve('0xe30582271082271094f8e191d2cd72ff35cb8f012685a29b31996614ea822710801c8080')
  }
}
