var Configuration = (function () {
    function Configuration(// host of the REST relay server
        host, 
        // port of REST relay server
        port, 
        // poll interval
        pollInterval, 
        // use websockets?
        useWebSockets) {
        if (host === void 0) { host = 'localhost'; }
        if (port === void 0) { port = 5000; }
        if (pollInterval === void 0) { pollInterval = 500; }
        if (useWebSockets === void 0) { useWebSockets = false; }
        this.host = host;
        this.port = port;
        this.pollInterval = pollInterval;
        this.useWebSockets = useWebSockets;
        this.apiUrl = "http://" + this.host + ":" + this.port + "/api/";
        this.wsApiUrl = "ws://" + this.host + ":" + this.port + "/api/";
    }
    return Configuration;
}());
export { Configuration };
//# sourceMappingURL=Configuration.js.map