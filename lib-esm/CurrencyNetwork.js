var CurrencyNetwork = (function () {
    function CurrencyNetwork(utils) {
        this.utils = utils;
    }
    CurrencyNetwork.prototype.getAll = function () {
        return this.utils.fetchUrl("networks");
    };
    CurrencyNetwork.prototype.getInfo = function (networkAddress) {
        return this.utils.fetchUrl("networks/" + networkAddress);
    };
    CurrencyNetwork.prototype.getUsers = function (networkAddress) {
        return this.utils.fetchUrl("networks/" + networkAddress + "/users");
    };
    CurrencyNetwork.prototype.getUserOverview = function (networkAddress, userAddress) {
        return this.utils.fetchUrl("networks/" + networkAddress + "/users/0x" + userAddress);
    };
    return CurrencyNetwork;
}());
export { CurrencyNetwork };
//# sourceMappingURL=CurrencyNetwork.js.map