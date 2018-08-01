import * as ethUtils from 'ethereumjs-util'

import { TxSigner } from './signers/TxSigner'
import { Transaction } from './Transaction'
import { Utils } from './Utils'
import {
  Amount,
  UserObject,
  Signature,
  RawTxObject
} from './typings'

/**
 * The User class contains all user related functions, which also include keystore
 * related methods.
 */
export class User {
  private _signer: TxSigner
  private _transaction: Transaction
  private _utils: Utils

  constructor (
    signer: TxSigner,
    transaction: Transaction,
    utils: Utils
  ) {
    this._signer = signer
    this._transaction = transaction
    this._utils = utils
  }

  /**
   * Checksummed Ethereum address of currently loaded user/keystore.
   */
  public get address (): string {
    return this._signer.address
  }

  /**
   * Public key of currently loaded user/keystore.
   */
  public get pubKey (): string {
    return this._signer.pubKey
  }

  /**
   * Creates a new user and the respective keystore using the configured signer.
   * Loads new user into the state and returns the created user object.
   */
  public async create (): Promise<UserObject> {
    const createdAccount = await this._signer.createAccount()
    return createdAccount
  }

  /**
   * Loads an existing user and respective keystore.
   * Returns the loaded user object.
   * @param serializedKeystore Serialized [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet) key store.
   */
  public async load (serializedKeystore: string): Promise<UserObject> {
    const loadedAccount = await this._signer.loadAccount(serializedKeystore)
    return loadedAccount
  }

  /**
   * Digitally signs a message hash with the currently loaded user/keystore.
   * @param msgHash Hash of message that should be signed.
   */
  public signMsgHash (msgHash: string): Promise<Signature> {
    return this._signer.signMsgHash(msgHash)
  }

  /**
   * Returns ETH balance of loaded user.
   */
  public async getBalance (): Promise<Amount> {
    return this._signer.getBalance()
  }

  /**
   * Encrypts a message with the public key of another user.
   * @param msg Plain text message that should get encrypted.
   * @param theirPubKey Public key of receiver of message.
   */
  public encrypt (msg: string, theirPubKey: string): Promise<any> {
    return this._signer.encrypt(msg, theirPubKey)
  }

  /**
   * Decrypts an encrypted message with the private key of loaded user.
   * @param encMsg Encrypted message.
   * @param theirPubKey Public key of sender of message.
   */
  public decrypt (encMsg: any, theirPubKey: string): Promise<any> {
    return this._signer.decrypt(encMsg, theirPubKey)
  }

  /**
   * Returns the 12 word seed of loaded user.
   */
  public showSeed (): Promise<string> {
    return this._signer.showSeed()
  }

  /**
   * Returns the private key of loaded user.
   */
  public exportPrivateKey (): Promise<string> {
    return this._signer.exportPrivateKey()
  }

  /**
   * Recovers user / keystore from 12 word seed.
   * @param seed 12 word seed phrase string.
   */
  public async recoverFromSeed (seed: string): Promise<UserObject> {
    const recoveredUser = await this._signer.recoverFromSeed(seed)
    return recoveredUser
  }

  /**
   * Returns a shareable link, which can be opened by other users who already have ETH
   * and are willing to send some of it to the new user. The function is called by a
   * new user who wants to get onboarded, respectively has no ETH or trustline.
   * @param username Name of new user who wants to get onboarded.
   * @param serializedKeystore Serialized [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet)
   *                           keystore of new user who wants to get onboarded.
   */
  public async createOnboardingMsg (
    username: string,
    serializedKeystore: string
  ): Promise<string> {
    const { address, pubKey } = await this._signer.loadAccount(serializedKeystore)
    const params = [ 'onboardingrequest', username, address, pubKey ]
    return this._utils.createLink(params)
  }

  /**
   * Returns an ethereum transaction object for onboarding a new user. Called by a user who already has ETH
   * and wants to onboard a new user by sending some of it.
   * @param newUserAddress Address of new user who wants to get onboarded.
   * @param initialValue Value of ETH to send, default is 0.1 ETH.
   */
  public async prepOnboarding (
    newUserAddress: string,
    initialValue = 0.1
  ): Promise<object> {
    return this._transaction.prepValueTx(
      this.address, // address of onboarder
      newUserAddress, // address of new user who gets onboarded
      this._utils.calcRaw(initialValue, 18)
    )
  }

  /**
   * Signs a raw transaction object as returned by `prepOnboarding`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirmOnboarding (rawTx: RawTxObject): Promise<string> {
    return this._transaction.confirm(rawTx)
  }

  /**
   * Returns a shareable link which can be send to other users.
   * Contains username and address.
   * @param username Custom username.
   */
  public async createLink (username: string): Promise<string> {
    const params = ['contact', this.address, username]
    return this._utils.createLink(params)
  }

  /**
   * @hidden
   * Gives some ETH to requesting address.
   * NOTE: Used only for dev purposes.
   */
  public requestEth (): Promise<string> {
    const options = {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ 'address': this.address })
    }
    return this._utils.fetchUrl('request-ether', options)
  }

  /**
   * @hidden
   * Verifies a signature.
   * @param message Signed message
   * @param signature Digital signature
   */
  public verifySignature (message: any, signature: string): boolean {
    const r = ethUtils.toBuffer(signature.slice(0, 66))
    const s = ethUtils.toBuffer(`0x${signature.slice(66, 130)}`)
    const v = ethUtils.bufferToInt(ethUtils.toBuffer(`0x${signature.slice(130, 132)}`))
    const m = ethUtils.sha3(JSON.stringify(message))
    const pub = ethUtils.ecrecover(m, v, r, s)
    const adr = `0x${ethUtils.pubToAddress(pub).toString('hex')}`
    console.log('Externally owned account: ', message.address)
    console.log('Recovered from signature: ', adr)
    return message.address === adr
  }
}
