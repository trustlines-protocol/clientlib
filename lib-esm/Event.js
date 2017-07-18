var Event = (function () {
    function Event(user, utils) {
        this.user = user;
        this.utils = utils;
        this.validParameters = ['type', 'fromBlock', 'toBlock'];
    }
    Event.prototype.eventObservable = function (networkAddress, filter) {
        var _a = this, user = _a.user, utils = _a.utils, validParameters = _a.validParameters;
        var baseUrl = "networks/" + networkAddress + "/users/0x" + user.proxyAddress + "/events";
        var parameterUrl = utils.buildUrl(baseUrl, validParameters, filter);
        return utils.createObservable(parameterUrl);
    };
    Event.prototype.get = function (networkAddress, filter) {
        var _a = this, user = _a.user, utils = _a.utils, validParameters = _a.validParameters;
        var baseUrl = "networks/" + networkAddress + "/users/0x" + user.proxyAddress + "/events";
        var parameterUrl = utils.buildUrl(baseUrl, validParameters, filter);
        return utils.fetchUrl(parameterUrl);
    };
    return Event;
}());
export { Event };
//# sourceMappingURL=Event.js.map