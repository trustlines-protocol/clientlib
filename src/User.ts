import { Utils } from './Utils'
import { Transaction } from './Transaction'

import * as lightwallet from 'eth-lightwallet'
// declare let lightwallet
import * as ethUtils from 'ethereumjs-util'
import { Observable } from 'rxjs/Observable'

export class User {
  public address: string
  public pubKey: string
  public keystore: any

  private _password = 'ts'
  private _signingPath = 'm/44\'/60\'/0\'/0' // path for signing keys

  constructor (private transaction: Transaction, private utils: Utils) {
  }

  public create (): Promise<object> {
    return new Promise((resolve, reject) => {
      this.generateKeys().then(keys => {
        this.address = ethUtils.toChecksumAddress(keys.address)
        this.pubKey = keys.pubKey
        const createdUser = {
          address: this.address,
          pubKey: this.pubKey,
          keystore: this.keystore.serialize()
        }
        resolve(createdUser)
      }).catch(err => reject(err))
    })
  }

  public load (serializedKeystore: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.setKeystore(serializedKeystore)
        .then(() => {
          this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
            if (err) {
              reject(err)
            }
            this.pubKey = lightwallet.encryption.addressToPublicEncKey(
              this.keystore,
              pwDerivedKey,
              this.address.toLowerCase() // NOTE eth-lightwallet can't handle checksummed address
            )
            resolve({
              address: this.address,
              pubKey: this.pubKey,
              keystore: this.keystore.serialize()
            })
          })
        })
    })
  }

  public signTx (rawTx: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(lightwallet.signing.signTx(
            this.keystore,
            pwDerivedKey,
            rawTx,
            this.address.toLowerCase() // NOTE eth-lightwallet does not handle checksum addresses
          ))
        }
      })
    })
  }

  public signMsg (rawMsg: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          reject(err)
        } else {
          const signature = lightwallet.signing.signMsg(
            this.keystore,
            pwDerivedKey,
            rawMsg,
            this.address.toLowerCase()
          )
          console.log('RAW', rawMsg)
          console.log('HASH', ethUtils.bufferToHex(ethUtils.sha3(rawMsg)))
          console.log('SIGNATURE', lightwallet.signing.concatSig(signature))
          resolve({
            ecSignature: {
              r: ethUtils.bufferToHex(signature.r),
              s: ethUtils.bufferToHex(signature.s),
              v: signature.v
            },
            concatSig: lightwallet.signing.concatSig(signature)
          })
        }
      })
    })
  }

  public createOnboardingMsg (username: string, serializedKeystore: string): Promise<string> {
    return new Promise<any>((resolve, reject) => {
      this.load(serializedKeystore).then(() => {
        const params = [ 'onboardingrequest', username, this.address, this.pubKey ]
        resolve(this.utils.createLink(params))
      })
    })
  }

  public prepOnboarding (newUserAddress: any): Promise<object> {
    return this.transaction.prepValueTx(
      this.address, // address of onboarder
      newUserAddress, // address of new user who gets onboarded
      0.01 // TODO fetch default onboarding amount of eth
    ).then(tx => tx)
    .catch(error => Promise.reject(error))
  }

  public confirmOnboarding (valueTx: string): Promise<any> {
    return this.signTx(valueTx)
      .then(signedTx => this.transaction.relayTx(signedTx))
      .then(txId => ({ txId }))
      .catch(error => Promise.reject(error))
  }

  public getBalance (): Promise<any> {
    return this.utils.fetchUrl(`users/${this.address}/balance`)
  }

  public balanceObservable (): Observable<any> {
    return this.utils.createObservable(`users/${this.address}/balance`)
  }

  public encrypt (msg: string, theirPubKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          reject(err)
          return false
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
        } catch (err) {
          console.log(err)
          reject(err)
        }
      })
    })
  }

  public decrypt (encMsg: any, theirPubKey: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          reject(err)
          return false
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

  public showSeed (): Promise<string> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          reject(err)
          return false
        }
        resolve(this.keystore.getSeed(pwDerivedKey))
      })
    })
  }

  public exportPrivateKey (): Promise<string> {
    return new Promise((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          reject(err)
          return false
        }
        resolve(this.keystore.exportPrivateKey(this.address.toLowerCase(), pwDerivedKey))
      })
    })
  }

  public recoverFromSeed (seed: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.generateKeys(seed).then(keys => {
        this.address = ethUtils.toChecksumAddress(keys.address)
        this.pubKey = keys.pubKey
        resolve({
          address: this.address,
          pubKey: this.pubKey,
          keystore: this.keystore.serialize()
        })
      }).catch(err => reject(err))
    })
  }

  public createLink (username: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = ['contact', this.address, username]
      resolve(this.utils.createLink(params))
    })
  }

  // NOTE: instead of onboarding for PoC
  public requestEth (): Promise<string> {
    const options = {
      method: 'POST',
      headers: new Headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ 'address': this.address })
    }
    return this.utils.fetchUrl('request-ether', options)
  }

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

  private generateKeys (seed?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let secretSeed = lightwallet.keystore.generateRandomSeed()
      lightwallet.keystore.createVault({
        password: this._password,
        seedPhrase: seed || secretSeed,
        hdPathString: this._signingPath
      }, (err: any, ks: any) => {
        if (err) {
          reject(err)
          return false
        }
        this.keystore = ks
        ks.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
          if (err) {
            reject(err)
          }
          this.keystore.generateNewAddress(pwDerivedKey)
          const address = this.keystore.getAddresses()[ 0 ]
          const pubKey = lightwallet.encryption.addressToPublicEncKey(
            this.keystore,
            pwDerivedKey,
            address
          )
          resolve({ address, pubKey })
        })
      })
    })
  }

  private setKeystore (serializedKeystore: string): Promise<void> {
    return new Promise((resolve, reject) => {
      let parsed = JSON.parse(serializedKeystore)
      if (parsed.version === 3) {
        this.keystore = lightwallet.keystore.deserialize(serializedKeystore)
        this.address = ethUtils.toChecksumAddress(this.keystore.getAddresses()[ 0 ])
        resolve()
      } else {
        delete parsed.ksData['m/44\'/60\'/0\'/1']
        lightwallet.upgrade.upgradeOldSerialized(JSON.stringify(parsed), this._password, (err, newSerialized) => {
          if (err) {
            reject(err)
            return false
          }
          this.keystore = lightwallet.keystore.deserialize(newSerialized)
          this.address = ethUtils.toChecksumAddress(this.keystore.getAddresses()[ 0 ])
          resolve()
        })
      }
    })
  }

}
