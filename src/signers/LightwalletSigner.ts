import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'

import { Utils } from '../Utils'
import { TxSigner } from './TxSigner'

import {
  Amount,
  RawTxObject,
  Signature,
  TxInfos,
  TxInfosRaw,
  UserObject
} from '../typings'

/**
 * The LightwalletSigner class contains functions for signing transactions with eth-lightwallet.
 */
export class LightwalletSigner implements TxSigner {
  public address: string
  public pubKey: string
  public keystore: any

  private lightwallet: any
  private utils: Utils

  private password = 'ts'
  private signingPath = "m/44'/60'/0'/0" // path for signing keys
  private userNotLoadedError = new Error('No account/keystore loaded.')

  constructor(lightwallet: any, utils: Utils) {
    this.lightwallet = lightwallet
    this.utils = utils
  }

  /**
   * Creates a new user and the respective keystore using eth-lightwallet.
   * Loads new user into the state and returns the created user object.
   */
  public async createAccount(): Promise<UserObject> {
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
   * Loads an existing user and respective keystore using eth-lightwallet.
   * Returns the loaded user object.
   * @param serializedKeystore Serialized [eth-lightwallet](https://github.com/ConsenSys/eth-lightwallet) key store.
   */
  public async loadAccount(serializedKeystore: string): Promise<UserObject> {
    const parsedKeystore = JSON.parse(serializedKeystore)
    // check if keystore version is old and update to new version
    if (parsedKeystore.version < 3) {
      serializedKeystore = await this._updateKeystore(parsedKeystore)
    }
    const deserialized = this.lightwallet.keystore.deserialize(
      serializedKeystore
    )
    const { address, keystore, pubKey } = await this._getUserObject(
      deserialized
    )
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
   * Digitally signs a message hash with the currently loaded user/keystore.
   * @param msgHash Hash of message that should be signed.
   */
  public signMsgHash(msgHash: string): Promise<Signature> {
    return new Promise((resolve, reject) => {
      if (!this._isUserLoaded()) {
        return reject(this.userNotLoadedError)
      }
      this.keystore.keyFromPassword(
        this.password,
        (err: any, pwDerivedKey: any) => {
          if (err) {
            return reject(err)
          }
          try {
            const msgHashBuff = ethUtils.toBuffer(msgHash)
            const personalMsgHashBuff = ethUtils.hashPersonalMessage(
              msgHashBuff
            )
            const signature = this.lightwallet.signing.signMsgHash(
              this.keystore,
              pwDerivedKey,
              ethUtils.bufferToHex(personalMsgHashBuff),
              this.address.toLowerCase()
            )
            resolve({
              concatSig: this.lightwallet.signing.concatSig(signature),
              ecSignature: {
                r: ethUtils.bufferToHex(signature.r),
                s: ethUtils.bufferToHex(signature.s),
                v: signature.v
              }
            })
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  /**
   * Returns ETH balance of loaded user by querying the relay server.
   */
  public async getBalance(): Promise<Amount> {
    if (!this._isUserLoaded()) {
      throw this.userNotLoadedError
    }
    const balance = await this.utils.fetchUrl<string>(
      `users/${this.address}/balance`
    )
    return this.utils.formatToAmount(this.utils.calcRaw(balance, 18), 18)
  }

  /**
   * Encrypts a message with the public key of another user.
   * @param msg Plain text message that should get encrypted.
   * @param theirPubKey Public key of receiver of message.
   */
  public encrypt(msg: string, theirPubKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this._isUserLoaded()) {
        return reject(this.userNotLoadedError)
      }
      this.keystore.keyFromPassword(
        this.password,
        (err: any, pwDerivedKey: any) => {
          if (err) {
            return reject(err)
          }
          try {
            const encrypted = this.lightwallet.encryption.multiEncryptString(
              this.keystore,
              pwDerivedKey,
              msg,
              this.address.toLowerCase(),
              [theirPubKey]
            )
            resolve(encrypted)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  /**
   * Decrypts an encrypted message with the private key of loaded user.
   * @param encMsg Encrypted message.
   * @param theirPubKey Public key of sender of message.
   */
  public decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this._isUserLoaded()) {
        return reject(this.userNotLoadedError)
      }
      this.keystore.keyFromPassword(
        this.password,
        (err: any, pwDerivedKey: any) => {
          if (err) {
            return reject(err)
          }
          try {
            const decryptedMsg = this.lightwallet.encryption.multiDecryptString(
              this.keystore,
              pwDerivedKey,
              encMsg,
              theirPubKey,
              this.address.toLowerCase()
            )
            resolve(decryptedMsg)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  /**
   * Returns the 12 word seed of loaded user.
   */
  public showSeed(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._isUserLoaded()) {
        return reject(this.userNotLoadedError)
      }
      this.keystore.keyFromPassword(
        this.password,
        (err: any, pwDerivedKey: any) => {
          if (err) {
            return reject(err)
          }
          try {
            const seed = this.keystore.getSeed(pwDerivedKey)
            resolve(seed)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  /**
   * Returns the private key of loaded user.
   */
  public exportPrivateKey(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this._isUserLoaded()) {
        return reject(this.userNotLoadedError)
      }
      this.keystore.keyFromPassword(
        this.password,
        (err: any, pwDerivedKey: any) => {
          if (err) {
            return reject(err)
          }
          try {
            const privateKey = this.keystore.exportPrivateKey(
              this.address.toLowerCase(),
              pwDerivedKey
            )
            resolve(privateKey)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  /**
   * Recovers user / keystore from 12 word seed.
   * @param seed 12 word seed phrase string.
   */
  public async recoverFromSeed(seed: string): Promise<UserObject> {
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
   * Takes a raw transaction object, turns it into a RLP encoded hex string, signs it with
   * the loaded user and relays the transaction.
   * @param rawTx Raw transaction object.
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    if (!this._isUserLoaded()) {
      return Promise.reject(this.userNotLoadedError)
    }
    let rlpTx
    const txOptions = {
      ...rawTx,
      from: rawTx.from.toLowerCase(),
      gasLimit: this.utils.convertToHexString(rawTx.gasLimit),
      gasPrice: this.utils.convertToHexString(rawTx.gasPrice),
      value: this.utils.convertToHexString(rawTx.value)
    }
    if (txOptions.to) {
      txOptions.to = txOptions.to.toLowerCase()
    }
    if (rawTx.functionCallData) {
      rlpTx = this.lightwallet.txutils.functionTx(
        rawTx.functionCallData.abi,
        rawTx.functionCallData.functionName,
        rawTx.functionCallData.args,
        txOptions
      )
    } else {
      rlpTx = this.lightwallet.txutils.valueTx(txOptions)
    }
    const signedTx = await this._signTx(rlpTx)
    return this._relayTx(signedTx)
  }

  /**
   * Returns needed information for creating an ethereum transaction.
   * @param userAddress address of user creating the transaction
   * @returns Information for creating an ethereum transaction for the given user address.
   *          See type `TxInfos` for more details.
   */
  public async getTxInfos(userAddress: string): Promise<TxInfos> {
    const endpoint = `users/${userAddress}/txinfos`
    const { nonce, gasPrice, balance } = await this.utils.fetchUrl<TxInfosRaw>(
      endpoint
    )
    return {
      balance: new BigNumber(balance),
      gasPrice: new BigNumber(gasPrice),
      nonce
    }
  }

  /**
   * Relays signed rlp encoded transactions.
   * @param signedTx signed RLP encoded ethereum transaction
   */
  private _relayTx(signedTx: string): Promise<string> {
    const headers = new Headers({ 'Content-Type': 'application/json' })
    const options = {
      body: JSON.stringify({ rawTransaction: `0x${signedTx}` }),
      headers,
      method: 'POST'
    }
    return this.utils.fetchUrl<string>('relay', options)
  }

  /**
   * Takes a raw transaction and digitally signs it with the currently loaded keystore.
   * @param rlpHexTx RLP encoded hex string of transaction.
   */
  private _signTx(rlpHexTx: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(
        this.password,
        (err: any, pwDerivedKey: any) => {
          if (err) {
            return reject(err)
          }
          resolve(
            this.lightwallet.signing.signTx(
              this.keystore,
              pwDerivedKey,
              rlpHexTx,
              this.address.toLowerCase() // NOTE eth-lightwallet does not handle checksum addresses
            )
          )
        }
      )
    })
  }

  /**
   * Creates or recovers a keystore.
   * @param seed (optional) 12 word seed string
   */
  private _generateKeys(seed?: string): Promise<UserObject> {
    return new Promise((resolve, reject) => {
      this.lightwallet.keystore.createVault(
        {
          hdPathString: this.signingPath,
          password: this.password,
          seedPhrase: seed || this.lightwallet.keystore.generateRandomSeed()
        },
        (err: any, keystore: any) => {
          if (err) {
            return reject(err)
          }
          const userObj = this._getUserObject(keystore)
          resolve(userObj)
        }
      )
    })
  }

  /**
   * Returns address, keystore and public key of given keystore.
   * @param keystore deserialized keystore object
   */
  private _getUserObject(keystore: any): Promise<UserObject> {
    return new Promise((resolve, reject) => {
      keystore.keyFromPassword(this.password, (err: any, pwDerivedKey: any) => {
        if (err) {
          return reject(err)
        }
        try {
          keystore.generateNewAddress(pwDerivedKey)
          const address = keystore.getAddresses()[0]
          const pubKey = this.lightwallet.encryption.addressToPublicEncKey(
            keystore,
            pwDerivedKey,
            address
          )
          resolve({
            address: ethUtils.toChecksumAddress(address),
            keystore,
            pubKey
          })
        } catch (error) {
          reject(error)
        }
      })
    })
  }

  /**
   * Updates an old keystore to new version. Old version < 3
   * @param parsedKeystore keystore as JSON object
   */
  private _updateKeystore(parsedKeystore: any): Promise<string> {
    return new Promise((resolve, reject) => {
      // remove encrypt path of HD wallet manually
      delete parsedKeystore.ksData["m/44'/60'/0'/1"]
      this.lightwallet.upgrade.upgradeOldSerialized(
        JSON.stringify(parsedKeystore),
        this.password,
        (err, newSerialized) => {
          if (err) {
            return reject(err)
          }
          resolve(newSerialized)
        }
      )
    })
  }

  /**
   * Checks if account/keystore is loaded.
   */
  private _isUserLoaded(): boolean {
    return this.address && this.pubKey && this.keystore
  }
}
