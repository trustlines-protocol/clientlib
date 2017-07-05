import { Observable } from "rxjs/Observable"
import { Observer } from "rxjs/Observer"

import { Configuration } from "./Configuration"

const ReconnectingWebSocket = require("reconnecting-websocket")

export class ObservableHelper {
    constructor(
        private config: Configuration,
        private url: string
    ) {
        if (config.useWebSockets && "WebSocket" in window) {
            return Observable.create((observer: Observer<any>) => {
                let ws = new ReconnectingWebSocket(`${config.wsApiUrl}${url}`)
                ws.onmessage = (e: MessageEvent) => {
                    const json = JSON.parse(e.data)
                    observer.next(json)
                }
                ws.onerror = (e: ErrorEvent) => {
                    console.error("An web socket error occured")
                }
                return () => {
                    ws.close(1000, "", {keepClosed: true})
                }
            })
        } else {
            let observable = Observable.create((observer: Observer<any>) => {
                fetch(`${config.apiUrl}${url}`)
                .then((response) => response.json())
                .then((json) => observer.next(json))
            }).interval(config.pollInterval)
            return observable
        }
    }
}
