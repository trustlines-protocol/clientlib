import { Observable } from "rxjs/Observable"
import { TimerObservable } from "rxjs/observable/TimerObservable"
import "rxjs/add/operator/mergeMap"
import "rxjs/add/operator/map"
import { Observer } from "rxjs/Observer"

import { Configuration } from "./Configuration"

const ReconnectingWebSocket = require("reconnecting-websocket")

export class ObservableHelper {

    public createObservable(config: Configuration, url: string): Observable<any> {
        const { useWebSockets, apiUrl, wsApiUrl, pollInterval } = config
        if (useWebSockets && "WebSocket" in window) {
            return Observable.create((observer: Observer<any>) => {
                let ws = new ReconnectingWebSocket(`${wsApiUrl}${url}`)
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
            return TimerObservable.create(0, pollInterval)
                .mergeMap(() =>
                    fetch(`${apiUrl}${url}`)
                    .then(res => res.json())
                    .catch(err => new Error("Could not get events"))
                )
        }
    }

}
