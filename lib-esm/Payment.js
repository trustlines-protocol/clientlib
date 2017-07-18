var Payment = (function () {
    function Payment(user, utils, transaction) {
        this.user = user;
        this.utils = utils;
        this.transaction = transaction;
    }
    Payment.prototype.prepare = function (networkAddress, receiver, value) {
        var _this = this;
        return this.getPath(networkAddress, this.user.address, receiver, value)
            .then(function (response) {
            if (response.path.length > 0) {
                return _this.transaction.prepare(networkAddress, 'mediatedTransfer', ['0x' + receiver, value, response.path.slice(1)]);
            }
            else {
                return Promise.reject('Could not find a path with enough capacity');
            }
        });
    };
    Payment.prototype.getPath = function (network, accountA, accountB, value) {
        var url = "networks/" + network + "/users/0x" + accountA + "/path/0x" + accountB;
        return this.utils.fetchUrl(url);
    };
    return Payment;
}());
export { Payment };
//# sourceMappingURL=Payment.js.map