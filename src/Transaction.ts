import { User } from "./User"
import { Utils } from "./Utils"
import { CurrencyNetwork } from "./CurrencyNetwork"

declare let lightwallet: any

export class Transaction {

    constructor(
        private user: User,
        private utils: Utils,
        private currencyNetwork: CurrencyNetwork) {
    }

    public prepareTransaction(functionName: string, parameters: any[]): Promise<any> {
        return Promise.all([this.getAbi(), this.getTxInfos(this.user.address)])
            .then(([abi, txinfos]) => {
                const txOptions = {
                    gasPrice: txinfos.gasPrice,
                    gasLimit: 1000000,
                    value: 0,
                    nonce: txinfos.nonce,
                    to: this.currencyNetwork.defaultNetwork,
                }
                const txObj = {
                    rawTx: lightwallet.txutils.functionTx(abi, functionName, parameters , txOptions),
                    gasPrice: txinfos.gasPrice,
                    nonce: txinfos.nonce,
                    gas: 200000
                }
                return txObj
            })
    }

    public confirmTransaction(rawTx: string): Promise<string> {
        return this.user.signTx(rawTx).then(signedTx => this.relayTx(signedTx))
    }

    private getAbi(): Promise<any> {
        return this.utils.fetchUrl(`tokenabi`)
    }

    private getTxInfos(address: string): Promise<any> {
        return this.utils.fetchUrl(`txinfos/0x${address}`)
    }

    private relayTx(data: string): Promise<string> {
        const headers = new Headers({
            "Content-Type": "application/json"
        })
        const options = {
            method: "POST",
            headers,
            body: JSON.stringify({data: "0x" + data})
        }
        return this.utils.fetchUrl("relay", options)
    }

    private handleError(error: any) {
        return Promise.reject(error.json().message || error)
    }
}
