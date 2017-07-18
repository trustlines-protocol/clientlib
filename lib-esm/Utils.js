import { Observable } from 'rxjs/Observable';
import { TimerObservable } from 'rxjs/observable/TimerObservable';
import 'rxjs/add/operator/mergeMap';
import 'rxjs/add/operator/map';
var ReconnectingWebSocket = require('reconnecting-websocket');
var Utils = (function () {
    function Utils(configuration) {
        this.configuration = configuration;
    }
    Utils.prototype.createObservable = function (url) {
        var _a = this.configuration, useWebSockets = _a.useWebSockets, apiUrl = _a.apiUrl, wsApiUrl = _a.wsApiUrl, pollInterval = _a.pollInterval;
        if (useWebSockets && 'WebSocket' in window) {
            return Observable.create(function (observer) {
                var ws = new ReconnectingWebSocket("" + wsApiUrl + url);
                ws.onmessage = function (e) {
                    var json = JSON.parse(e.data);
                    observer.next(json);
                };
                ws.onerror = function (e) {
                    console.error('An web socket error occured');
                };
                return function () {
                    ws.close(1000, '', { keepClosed: true });
                };
            });
        }
        else {
            return TimerObservable.create(0, pollInterval)
                .mergeMap(function () {
                return fetch("" + apiUrl + url)
                    .then(function (res) { return res.json(); })
                    .catch(function (err) { return new Error("Could not get events: " + err.message); });
            });
        }
    };
    Utils.prototype.fetchUrl = function (url, options) {
        var apiUrl = this.configuration.apiUrl;
        return fetch("" + apiUrl + url, options)
            .then(function (response) { return response.json(); })
            .then(function (json) { return json; })
            .catch(function (error) { return Promise.reject(error.json().message || error); });
    };
    Utils.prototype.buildUrl = function (baseUrl, validParameters, parameters) {
        if (!parameters || typeof parameters !== 'object') {
            return baseUrl;
        }
        for (var key in parameters) {
            if (parameters[key] && validParameters.indexOf(key) !== -1) {
                baseUrl += (baseUrl.indexOf('?') === -1) ? '?' : '&';
                baseUrl += key + "=" + parameters[key];
            }
        }
        return baseUrl;
    };
    return Utils;
}());
export { Utils };
//# sourceMappingURL=Utils.js.map