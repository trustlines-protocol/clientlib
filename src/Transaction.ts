import { Configuration } from "./Configuration"
import { User } from "./User"

const lightwallet = require("eth-lightwallet")

export class Transaction {

    constructor(private config: Configuration, private user: User) {}

    public prepareTransaction(functionName: string, parameters: any[]): Promise<string> {
        return Promise.all([this.getAbi(), this.getTxInfos(this.user.address)])
            .then(([abi, txinfos]) => {
                const txOptions = {
                    gasPrice: txinfos.gasPrice,
                    gasLimit: 1000000,
                    value: 0,
                    nonce: txinfos.nonce,
                    to: this.config.tokenAddress,
                }
                const tx = lightwallet.txutils.functionTx(abi, functionName, parameters , txOptions)
                return tx
            })
    }

    private getAbi(): Promise<any> {
        return fetch(`${this.config.apiUrl}tokenabi`)
            .then((res) => res.json())
            .then((json) => json.abi)
            .catch(this.handleError)
    }

    private getTxInfos(address: string): Promise<any> {
        return fetch(`${this.config.apiUrl}txinfos/0x${address}`)
            .then((response) => response.json())
            .then((json) => json.txinfos)
            .catch(this.handleError)
    }


    public relayTx(data: string): Promise<string> {
        const headers = new Headers({
            "Content-Type": "application/json"
        })
        return fetch(this.config.apiUrl + "relay", {
            method: "POST",
            headers,
            body: JSON.stringify({data: "0x" + data})
        }).then((res) => res.json())
        .then((json) => json.tx)
        .catch(this.handleError);
    }

    private handleError(error: any) {
        return Promise.reject(error.json().message || error)
    }
}
