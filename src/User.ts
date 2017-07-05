import * as lightwallet from "eth-lightwallet"

export class User {
    public username: string
    public address: string
    public keystore: any

    private _password = "ts"

    public generateKey(): Promise<string> {
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

    public deserializeKeystore(serializedKeystore: string) {
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
