import { User } from './User'
import { Utils } from './Utils'
import { Transaction } from './Transaction'
import { RawTxObject } from './typings'

/**
 * The User class contains all user related functions, which also include keystore
 * related methods.
 */
export class Onboarding {

  private _transaction: Transaction
  private _user: User
  private _utils: Utils

  constructor (
    transaction: Transaction,
    user: User,
    utils: Utils
  ) {
    this._transaction = transaction
    this._user = user
    this._utils = utils
  }

  /**
   * Returns a shareable link, which can be opened by other users who already have ETH
   * and are willing to send some of it to the new user. The function is called by a
   * new user who wants to get onboarded, respectively has no ETH or trustline.
   * @param username Name of new user who wants to get onboarded.
   * @param serializedKeystore Serialized [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet)
   *                           keystore of new user who wants to get onboarded.
   */
  public async createRequest (
    username: string,
    serializedKeystore: string
  ): Promise<string> {
    const { address, pubKey } = await this._user.load(serializedKeystore)
    const params = [ 'onboardingrequest', username, address, pubKey ]
    return this._utils.createLink(params)
  }

  /**
   * Returns an ethereum transaction object for onboarding a new user. Called by a user who already has ETH
   * and wants to onboard a new user by sending some of it.
   * @param newUserAddress Address of new user who wants to get onboarded.
   * @param initialValue Value of ETH to send, default is 0.1 ETH.
   */
  public async prepare (
    newUserAddress: string,
    initialValue = 0.1
  ): Promise<object> {
    return this._transaction.prepValueTx(
      this._user.address, // address of onboarder
      newUserAddress, // address of new user who gets onboarded
      this._utils.calcRaw(initialValue, 18)
    )
  }

  /**
   * Signs a raw transaction object as returned by `prepare`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm (rawTx: RawTxObject): Promise<string> {
    return this._transaction.confirm(rawTx)
  }
}
