import { TLNetwork } from "./TLNetwork"

import "isomorphic-fetch"
import { polyfill } from "es6-promise"
import * as lightwallet from "eth-lightwallet"

export class Transaction {

    constructor(private tlNetwork: TLNetwork) {
    }

    public prepareTransaction(functionName: string, parameters: any[]): Promise<string> {
        const { user, defaultNetwork } = this.tlNetwork
        return Promise.all([this.getAbi(), this.getTxInfos(user.address)])
            .then(([abi, txinfos]) => {
                const txOptions = {
                    gasPrice: txinfos.gasPrice,
                    gasLimit: 1000000,
                    value: 0,
                    nonce: txinfos.nonce,
                    to: defaultNetwork,
                }
                const tx = lightwallet.txutils.functionTx(abi, functionName, parameters , txOptions)
                return tx
            })
    }

    private getAbi(): Promise<any> {
        const { configuration } = this.tlNetwork
        return fetch(`${configuration.apiUrl}tokenabi`)
            .then(res => res.json())
            .then(json => json.abi)
            .catch(this.handleError)
    }

    private getTxInfos(address: string): Promise<any> {
        const { configuration } = this.tlNetwork
        return fetch(`${configuration.apiUrl}txinfos/0x${address}`)
            .then((response) => response.json())
            .then((json) => json.txinfos)
            .catch(this.handleError)
    }

    public relayTx(data: string): Promise<string> {
        const { configuration } = this.tlNetwork
        const headers = new Headers({
            "Content-Type": "application/json"
        })
        return fetch(`${configuration.apiUrl}relay`, {
            method: "POST",
            headers,
            body: JSON.stringify({data: "0x" + data})
        }).then((res) => res.json())
        .then((json) => json.tx)
        .catch(this.handleError)
    }

    private handleError(error: any) {
        return Promise.reject(error.json().message || error)
    }
}
