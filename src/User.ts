import lightwallet from 'eth-lightwallet'
import { bufferToHex, generateAddress } from 'ethereumjs-util'

export class User {

  public address: string
  public proxyAddress: string
  public keystore: any

  private _password = 'ts'

  public create (): Promise<object> {
    return new Promise((resolve, reject) => {
      this.generateKey().then((address) => {
        this.address = `0x${address}`
        this.proxyAddress = this.computeProxyAddress(address)
        const createdUser = {
          address: this.address,
          proxyAddress: this.proxyAddress,
          keystore: this.keystore.serialize()
        }
        resolve(createdUser)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  public load (serializedKeystore: string): Promise<object> {
    return new Promise((resolve, reject) => {
      if (serializedKeystore) { // TODO: check if valid keystore
        this.keystore = lightwallet.keystore.deserialize(serializedKeystore)
        this.address = `0x${this.keystore.getAddresses()[ 0 ]}`
        this.proxyAddress = this.computeProxyAddress(this.address)
        const loadedUser = {
          address: this.address,
          proxyAddress: this.proxyAddress,
          keystore: this.keystore.serialize()
        }
        resolve(loadedUser)
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

  private computeProxyAddress (address: string): string {
    return bufferToHex(generateAddress(address, 0))
  }

  public onboardUser (newUser: string) {
    // TODO: define relay api
  }

  private generateKey (): Promise<string> {
    return new Promise((resolve, reject) => {
      let secretSeed = lightwallet.keystore.generateRandomSeed()
      lightwallet.keystore.createVault({
        password: this._password,
        seedPhrase: secretSeed
      }, (err: any, ks: any) => {
        if (err) reject(err)
        this.keystore = ks
        ks.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
          if (err) reject(err)
          this.keystore.generateNewAddress(pwDerivedKey)
          const address = this.keystore.getAddresses()[ 0 ]
          resolve(address)
        })
      })
    })
  }

}
