import * as lightwallet from 'eth-lightwallet'
// declare let lightwallet
import * as ethUtils from 'ethereumjs-util'

import { Utils } from './Utils'
import { Transaction } from './Transaction'
import {
  Amount,
  UserObject,
  Signature
} from './typings'

/**
 * The User class contains all user related functions, which also include keystore
 * related methods.
 */
export class User {
  /**
   * Checksummed Ethereum address of currently loaded user/keystore.
   */
  public address: string
  /**
   * Public key of currently loaded user/keystore.
   */
  public pubKey: string
  /**
   * Loaded [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet) Keystore object.
   */
  public keystore: any

  private _transaction: Transaction
  private _utils: Utils
  private _web3: any

  private _password = 'ts'
  private _signingPath = 'm/44\'/60\'/0\'/0' // path for signing keys

  constructor (
    transaction: Transaction,
    utils: Utils,
    web3: any
  ) {
    this._transaction = transaction
    this._utils = utils
    this._web3 = web3
    if (this._web3.currentProvider) {
      this.loadWeb3Account()
    }
  }

  /**
   * Creates a new user and the respective keystore.
   * Loads new user into the state and returns the created user object.
   */
  public async create (): Promise<UserObject> {
    // generate new keystore
    const { address, keystore, pubKey } = await this._generateKeys()
    this.address = address
    this.keystore = keystore
    this.pubKey = pubKey
    return {
      address: this.address,
      keystore: this.keystore.serialize(),
      pubKey: this.pubKey
    }
  }

  /**
   * Loads an existing user and respective keystore.
   * Returns the loaded user object.
   * @param serializedKeystore Serialized [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet) key store.
   */
  public async load (serializedKeystore: string): Promise<UserObject> {
    const parsedKeystore = JSON.parse(serializedKeystore)
    // check if keystore version is old and update to new version
    if (parsedKeystore.version < 3) {
      serializedKeystore = await this._updateKeystore(parsedKeystore)
    }
    const deserialized = lightwallet.keystore.deserialize(serializedKeystore)
    const { address, keystore, pubKey } = await this._getUserObject(deserialized)
    this.address = address
    this.keystore = keystore
    this.pubKey = pubKey
    return {
      address: this.address,
      keystore: this.keystore.serialize(),
      pubKey: this.pubKey
    }
  }

  public async loadWeb3Account (): Promise<void> {
    if (this._web3.eth.defaultAccount) {
      this.address = this._web3.eth.defaultAccount
    } else {
      [ this.address ] = await this._web3.eth.getAccounts()
    }
  }

  /**
   * Takes a raw transaction and digitally signs it with the currently loaded keystore.
   * @param rawTx RLP encoded hex string of transaction.
   */
  public signTx (rawTx: string): Promise<string> {
    return new Promise((resolve, reject) => {
      // NOTE: WIP -> only temporary for testing purposes
      if (!this._web3.currentProvider) {
        this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
          if (err) {
            return reject(err)
          }
          resolve(lightwallet.signing.signTx(
            this.keystore,
            pwDerivedKey,
            rawTx,
            this.address.toLowerCase() // NOTE eth-lightwallet does not handle checksum addresses
          ))
        })
      } else {
        resolve(rawTx)
      }
    })
  }

  /**
   * Digitally signs a message hash with the currently loaded user/keystore.
   * @param msgHash Hash of message that should be signed.
   */
  public signMsgHash (msgHash: string): Promise<Signature> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          return reject(err)
        }
        const msgHashBuff = ethUtils.toBuffer(msgHash)
        const personalMsgHashBuff = ethUtils.hashPersonalMessage(msgHashBuff)
        const signature = lightwallet.signing.signMsgHash(
          this.keystore,
          pwDerivedKey,
          ethUtils.bufferToHex(personalMsgHashBuff),
          this.address.toLowerCase()
        )
        resolve({
          ecSignature: {
            r: ethUtils.bufferToHex(signature.r),
            s: ethUtils.bufferToHex(signature.s),
            v: signature.v
          },
          concatSig: lightwallet.signing.concatSig(signature)
        })
      })
    })
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
    const { address, pubKey } = await this.load(serializedKeystore)
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
   * Posts a raw onboarding ethereum transaction to the relay server and returns the transaction hash.
   * @param rawTx RLP encoded hex string of the ethereum transaction returned by `prepOnboarding`.
   */
  public async confirmOnboarding (rawTx: string): Promise<string> {
    const signedTx = await this.signTx(rawTx)
    return this._transaction.relayTx(signedTx)
  }

  /**
   * Returns ETH balance of loaded user.
   */
  public async getBalance (): Promise<Amount> {
    const balance = await this._utils.fetchUrl<string>(`users/${this.address}/balance`)
    return this._utils.formatToAmount(
      this._utils.calcRaw(balance, 18), 18
    )
  }

  /**
   * Encrypts a message with the public key of another user.
   * @param msg Plain text message that should get encrypted.
   * @param theirPubKey Public key of receiver of message.
   */
  public encrypt (msg: string, theirPubKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          return reject(err)
        }
        try {
          const encrypted = lightwallet.encryption.multiEncryptString(
            this.keystore,
            pwDerivedKey,
            msg,
            this.address.toLowerCase(),
            [ theirPubKey ]
          )
          resolve(encrypted)
        } catch (error) {
          return reject(err)
        }
      })
    })
  }

  /**
   * Decrypts an encrypted message with the private key of loaded user.
   * @param encMsg Encrypted message.
   * @param theirPubKey Public key of sender of message.
   */
  public decrypt (encMsg: any, theirPubKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          return reject(err)
        }
        resolve(lightwallet.encryption.multiDecryptString(
          this.keystore,
          pwDerivedKey,
          encMsg,
          theirPubKey,
          this.address.toLowerCase()
        ))
      })
    })
  }

  /**
   * Returns the 12 word seed of loaded user.
   */
  public showSeed (): Promise<string> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          return reject(err)
        }
        resolve(this.keystore.getSeed(pwDerivedKey))
      })
    })
  }

  /**
   * Returns the private key of loaded user.
   */
  public exportPrivateKey (): Promise<string> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          return reject(err)
        }
        resolve(this.keystore.exportPrivateKey(this.address.toLowerCase(), pwDerivedKey))
      })
    })
  }

  /**
   * Recovers user / keystore from 12 word seed.
   * @param seed 12 word seed phrase string.
   */
  public async recoverFromSeed (seed: string): Promise<UserObject> {
    const { address, keystore, pubKey } = await this._generateKeys(seed)
    this.address = address
    this.keystore = keystore
    this.pubKey = pubKey
    return {
      address: this.address,
      keystore: this.keystore.serialize(),
      pubKey: this.pubKey
    }
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

  /**
   * Creates or recovers a keystore.
   * @param seed (optional) 12 word seed string
   */
  private _generateKeys (seed?: string): Promise<UserObject> {
    return new Promise((resolve, reject) => {
      lightwallet.keystore.createVault({
        password: this._password,
        seedPhrase: seed || lightwallet.keystore.generateRandomSeed(),
        hdPathString: this._signingPath
      }, (err: any, keystore: any) => {
        if (err) {
          return reject(err)
        }
        resolve(this._getUserObject(keystore))
      })
    })
  }

  /**
   * Returns address, keystore and public key of given keystore.
   * @param keystore deserialized keystore object
   */
  private _getUserObject (keystore: any): Promise<UserObject> {
    return new Promise((resolve, reject) => {
      keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          return reject(err)
        }
        keystore.generateNewAddress(pwDerivedKey)
        const address = keystore.getAddresses()[0]
        const pubKey = lightwallet.encryption.addressToPublicEncKey(
          keystore,
          pwDerivedKey,
          address
        )
        resolve({
          address: ethUtils.toChecksumAddress(address),
          keystore,
          pubKey
        })
      })
    })
  }

  /**
   * Updates an old keystore to new version. Old version < 3
   * @param parsedKeystore keystore as JSON object
   */
  private _updateKeystore (parsedKeystore: any): Promise<string> {
    return new Promise((resolve, reject) => {
      // remove encrypt path of HD wallet manually
      delete parsedKeystore.ksData['m/44\'/60\'/0\'/1']
      lightwallet.upgrade.upgradeOldSerialized(
        JSON.stringify(parsedKeystore),
        this._password,
        (err, newSerialized) => err ? reject(err) : resolve(newSerialized)
      )
    })
  }
}
