const lightwallet = require("eth-lightwallet")

export class User {
    public username: string
    public address: string

    private _keystore: any
    private _password = "ts"

    public generateKey(): Promise<string> {
        return new Promise((resolve, reject) => {
            let secretSeed = lightwallet.keystore.generateRandomSeed()
            lightwallet.keystore.createVault({
                password: this._password,
                seedPhrase: secretSeed
            }, (err: any, ks: any) => {
                if (err) reject(err)
                this._keystore = ks
                ks.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
                    if (err) reject(err)
                    this._keystore.generateNewAddress(pwDerivedKey)
                    const address = this._keystore.getAddresses()[0]
                    resolve(address)
                })
            })
        })
    }

    public get keystore() {
        return this._keystore.serialize()
    }

    public set keystore(serializedKeystore: string) {
        this._keystore = lightwallet.keystore.deserialize(serializedKeystore)
        this.address = this._keystore.getAddresses()[0]
    }

    public signTx(rawTx: any): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            this._keystore.keyFromPassword(this._password, (err: any, pwDerivedKey: any) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(lightwallet.signing.signTx(this._keystore, pwDerivedKey, rawTx, this.address))
                }
            })
        })
    }
}
