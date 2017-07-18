var Contact = (function () {
    function Contact(user, utils) {
        this.user = user;
        this.utils = utils;
    }
    Contact.prototype.getAll = function (networkAddress) {
        var _a = this, user = _a.user, utils = _a.utils;
        var url = "networks/" + networkAddress + "/users/0x" + user.proxyAddress + "/contacts";
        return utils.fetchUrl(url);
    };
    return Contact;
}());
export { Contact };
//# sourceMappingURL=Contact.js.map