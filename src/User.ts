declare let lightwallet: any

export class User {

    public address: string
    public proxyAddress: string
    public keystore: any

    private _password = "ts"

    public create(): Promise<object> {
        return new Promise((resolve, reject) => {
            this.generateKey().then((address) => {
                this.address = address
                this.proxyAddress = "0xb33f..." // TODO implement
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

    public load(serializedKeystore: string): Promise<object> {
        return new Promise((resolve, reject) => {
            if (serializedKeystore) { // TODO: check if valid keystore
                this.keystore = this.deserializeKeystore(serializedKeystore)
                this.address = this.keystore.getAddresses()[0]
                this.proxyAddress = '0xb33f..' // TODO implement
                const loadedUser = {
                    address: this.address,
                    proxyAddress: this.proxyAddress,
                    keystore: this.keystore.serialize()
                }
                resolve(loadedUser)
            } else {
                reject(new Error("No valid keystore"))
            }
        })
    }

    private generateKey(): Promise<string> {
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
                    const address = this.keystore.getAddresses()[0]
                    resolve(address)
                })
            })
        })
    }

    private deserializeKeystore(serializedKeystore: string) {
        return lightwallet.keystore.deserialize(serializedKeystore)
    }

    public signTx(rawTx: any): Promise<string> {
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

    // TODO: define relay api
    public onboardUser(newUser: string) {

    }
}
