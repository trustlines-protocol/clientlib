var Transaction = (function () {
    function Transaction(user, utils) {
        this.user = user;
        this.utils = utils;
    }
    Transaction.prototype.prepare = function (networkAddress, functionName, parameters) {
        return Promise.all([this.getAbi(), this.getTxInfos(this.user.address)])
            .then(function (_a) {
            var abi = _a[0], txinfos = _a[1];
            var txOptions = {
                gasPrice: txinfos.gasPrice,
                gasLimit: 1000000,
                value: 0,
                nonce: txinfos.nonce,
                to: networkAddress
            };
            var txObj = {
                rawTx: lightwallet.txutils.functionTx(abi, functionName, parameters, txOptions),
                gasPrice: txinfos.gasPrice,
                nonce: txinfos.nonce,
                gas: 200000
            };
            return txObj;
        });
    };
    Transaction.prototype.confirm = function (rawTx) {
        var _this = this;
        return this.user.signTx(rawTx).then(function (signedTx) { return _this.relayTx(signedTx); });
    };
    Transaction.prototype.getAbi = function () {
        return this.utils.fetchUrl("tokenabi");
    };
    Transaction.prototype.getTxInfos = function (address) {
        return this.utils.fetchUrl("txinfos/0x" + address);
    };
    Transaction.prototype.relayTx = function (data) {
        var headers = new Headers({
            'Content-Type': 'application/json'
        });
        var options = {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ data: '0x' + data })
        };
        return this.utils.fetchUrl('relay', options);
    };
    Transaction.prototype.handleError = function (error) {
        return Promise.reject(error.json().message || error);
    };
    return Transaction;
}());
export { Transaction };
//# sourceMappingURL=Transaction.js.map