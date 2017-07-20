import lightwallet from 'eth-lightwallet'
import * as ethUtils from 'ethereumjs-util'

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

  public createOnboardingMsg (network: string, creditline: number, acceptance: number) {
    const data = {network, creditline, acceptance}
    this.keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
      if (err) {
        console.error(err)
        return
      }
      const hash = ethUtils.bufferToHex(ethUtils.sha3(JSON.stringify(data)))
      const signature = lightwallet.signing.signMsgHash(this.keystore, pwDerivedKey, hash, this.address)
      return { data, signature: lightwallet.signing.concatSig(signature)}
    })
  }

  public checkOnboardingMsg (ext: string, data: object, signature: string): boolean {
    const r = ethUtils.toBuffer(signature.slice(0, 66))
    const s = ethUtils.toBuffer(`0x${signature.slice(66, 130)}`)
    const v = ethUtils.bufferToInt(ethUtils.toBuffer(`0x${signature.slice(130, 132)}`))
    const m = ethUtils.sha3(JSON.stringify(data))
    const pub = ethUtils.ecrecover(m, v, r, s)
    const adr = `0x${ethUtils.pubToAddress(pub).toString('hex')}`
    console.log('Externally owned account: ', ext)
    console.log('Recovered from signature: ', adr)
    return ext === adr
  }

  private computeProxyAddress (address: string): string {
    return ethUtils.bufferToHex(ethUtils.generateAddress(address, 0))
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
