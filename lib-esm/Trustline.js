var Trustline = (function () {
    function Trustline(user, utils, transaction) {
        this.user = user;
        this.utils = utils;
        this.transaction = transaction;
    }
    Trustline.prototype.prepareUpdate = function (network, debtor, value) {
        var _a = this, transaction = _a.transaction, user = _a.user;
        return transaction.prepare(network, 'updateCreditline', ["0x" + debtor, value]);
    };
    Trustline.prototype.prepareAccept = function (network, creditor) {
        var _a = this, transaction = _a.transaction, user = _a.user;
        return transaction.prepare(network, 'acceptCreditline', ["0x" + creditor]);
    };
    Trustline.prototype.getAll = function (networkAddress) {
        var _a = this, user = _a.user, utils = _a.utils;
        return utils.fetchUrl("networks/" + networkAddress + "/users/0x" + user.proxyAddress + "/trustlines");
    };
    Trustline.prototype.get = function (networkAddress, userAddressB) {
        var _a = this, user = _a.user, utils = _a.utils;
        return utils.fetchUrl("networks/" + networkAddress + "/users/0x" + user.proxyAddress + "/trustlines/" + userAddressB);
    };
    return Trustline;
}());
export { Trustline };
//# sourceMappingURL=Trustline.js.map