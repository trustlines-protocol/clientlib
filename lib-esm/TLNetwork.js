import { Configuration } from './Configuration';
import { User } from './User';
import { Transaction } from './Transaction';
import { Payment } from './Payment';
import { Trustline } from './Trustline';
import { CurrencyNetwork } from './CurrencyNetwork';
import { Contact } from './Contact';
import { Utils } from './Utils';
import { Event } from './Event';
var TLNetwork = (function () {
    function TLNetwork(config) {
        if (config === void 0) { config = {}; }
        var host = config.host, port = config.port, tokenAddress = config.tokenAddress, pollInterval = config.pollInterval, useWebSockets = config.useWebSockets;
        this.configuration = new Configuration(host, port, pollInterval, useWebSockets);
        this.user = new User();
        this.utils = new Utils(this.configuration);
        this.currencyNetwork = new CurrencyNetwork(this.utils);
        this.event = new Event(this.user, this.utils);
        this.contact = new Contact(this.user, this.utils);
        this.transaction = new Transaction(this.user, this.utils);
        this.trustline = new Trustline(this.user, this.utils, this.transaction);
        this.payment = new Payment(this.user, this.utils, this.transaction);
    }
    return TLNetwork;
}());
export { TLNetwork };
//# sourceMappingURL=TLNetwork.js.map