import lightwallet from 'eth-lightwallet'
import { Utils } from './Utils'
import { Transaction } from './Transaction'

import * as ethUtils from 'ethereumjs-util'
import { Observable } from 'rxjs/Observable'


export class User {

  public address: string
  public proxyAddress: string
  public pubKey: string
  public keystore: any

  private _password = 'ts'
  private _signingPath = 'm/44\'/60\'/0\'/0' // path for signing keys
  private _encPath = 'm/44\'/60\'/0\'/1' // path for encryption keys

  constructor (private transaction: Transaction, private utils: Utils) {
  }

  public create (): Promise<object> {
    return new Promise((resolve, reject) => {
      this.generateKeys().then(keys => {
        this.address = `0x${keys.address}`
        this.pubKey = keys.pubKey
        const createdUser = {
          address: this.address,
          proxyAddress: this.proxyAddress,
          pubKey: this.pubKey,
          keystore: this.keystore.serialize()
        }
        resolve(createdUser)
      }).catch(err => reject(err))
    })
  }

  public load (serializedKeystore: string): Promise<object> {
    return new Promise((resolve, reject) => {
      if (serializedKeystore) { // TODO: check if valid keystore
        this.keystore = lightwallet.keystore.deserialize(serializedKeystore)
        this.address = `0x${this.keystore.getAddresses()[ 0 ]}`
        this.pubKey = this.keystore.getPubKeys(this._encPath)[ 0 ]
        this.getProxyAddress().then(res => {
          this.proxyAddress = res.proxyAddress
          resolve({
            address: this.address,
            proxyAddress: this.proxyAddress,
            pubKey: this.pubKey,
            keystore: this.keystore.serialize()
          })
        })
      } else {
        reject(new Error('No valid keystore'))
      }
    })
  }

  public signTx (rawTx: any): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) {
          reject(err)
        } else {
          resolve(lightwallet.signing.signTx(this.keystore, pwDerivedKey, rawTx, this.address))
        }
      })
    })
  }

  public createOnboardingMsg (username: string, serializedKeystore: string): Promise<object> {
    return new Promise<any>((resolve, reject) => {
      this.load(serializedKeystore).then(() => {
        const params = [ username, this.address, this.pubKey ]
        resolve(this.utils.createLink('onboarding', params))
      })
    })
  }

  public prepOnboarding (newUserAddress: any): Promise<object> {
    return Promise.all([
      this.prepProxy(newUserAddress, newUserAddress, newUserAddress), // TODO replace with actual parameters
      this.transaction.prepValueTx(
        this.address, // address of onboarder
        newUserAddress, // address of new user who gets onboarded
        100000 // TODO fetch default onboarding amount of eth
      )
    ]).then(([ proxyTx, valueTx ]) => {
      return { proxyTx, valueTx }
    })
  }

  public prepProxy (destination: string, userKey: string, recoveryKey: string): Promise<any> {
    return this.transaction.prepFuncTx(
      this.address,
      '0xf8e191d2cd72ff35cb8f012685a29b31996614ea', // TODO replace with actual contract address
      'IdentityFactoryWithRecovery',
      'CreateProxyWithControllerAndRecoveryKey',
      [ destination, userKey, recoveryKey, 0, 0 ] // TODO replace with actual parameters
    )
  }

  public confirmOnboarding (proxyTx: string, valueTx: string): Promise<any> {
    return Promise.all([
      this.signTx(proxyTx).then(signedTx => this.transaction.relayTx(signedTx)),
      this.signTx(valueTx).then(signedTx => this.transaction.relayTx(signedTx))
    ]).then(([ proxyTx, valueTx ]) => {
      return {
        proxyTxId: proxyTx.txId,
        valueTxId: valueTx.txId
      }
    })
  }

  public getProxyAddress (): Promise<any> {
    return this.utils.fetchUrl(`proxys/${this.address}`)
  }

  public getBalance (): Promise<any> {
    return this.utils.fetchUrl(`balances/${this.address}`)
  }

  public balanceObservable (): Observable<any> {
    return this.utils.createObservable(`balances/${this.address}`)
  }

  public encrypt (msg: string, theirPubKey: string): Promise<any> {
    return new Promise ((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) reject(err)
        resolve(lightwallet.encryption.multiEncryptString(
          this.keystore,
          pwDerivedKey,
          msg,
          this.pubKey,
          [ theirPubKey ],
          this._encPath
        ))
      })
    })
  }

  public decrypt (encMsg: any, theirPubKey: string): Promise<any> {
    return new Promise ((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) reject(err)
        resolve(lightwallet.encryption.multiDecryptString(
          this.keystore,
          pwDerivedKey,
          encMsg,
          theirPubKey,
          this.pubKey,
          this._encPath
        ))
      })
    })
  }

  public showSeed (): Promise<string> {
    return new Promise ((resolve, reject) => {
      this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
        if (err) reject(err)
        resolve(this.keystore.getSeed(pwDerivedKey))
      })
    })
  }
  private verifySignature (message: any, signature: string): boolean {
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

  private computeProxyAddress (address: string): string {
    return ethUtils.bufferToHex(ethUtils.generateAddress(address, 0))
  }

  private generateKeys (): Promise<any> {
    return new Promise((resolve, reject) => {
      let secretSeed = lightwallet.keystore.generateRandomSeed()
      lightwallet.keystore.createVault({
        password: this._password,
        seedPhrase: secretSeed,
        hdPathString: this._signingPath
      }, (err: any, ks: any) => {
        if (err) reject(err)
        this.keystore = ks
        ks.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
          if (err) reject(err)
          this.keystore.generateNewAddress(pwDerivedKey)
          this.keystore.addHdDerivationPath(this._encPath, pwDerivedKey, {curve: 'curve25519', purpose: 'asymEncrypt'})
          this.keystore.generateNewEncryptionKeys(pwDerivedKey, 1, this._encPath)
          const address = this.keystore.getAddresses()[ 0 ]
          const pubKey = this.keystore.getPubKeys(this._encPath)[ 0 ]
          resolve({ address, pubKey })
        })
      })
    })
  }

}
