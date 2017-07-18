import lightwallet from 'eth-lightwallet';
var User = (function () {
    function User() {
        this._password = 'ts';
    }
    User.prototype.create = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.generateKey().then(function (address) {
                _this.address = address;
                _this.proxyAddress = '0xb33f...'; // TODO implement
                var createdUser = {
                    address: _this.address,
                    proxyAddress: _this.proxyAddress,
                    keystore: _this.keystore.serialize()
                };
                resolve(createdUser);
            }).catch(function (err) {
                reject(err);
            });
        });
    };
    User.prototype.load = function (serializedKeystore) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (serializedKeystore) {
                _this.keystore = _this.deserializeKeystore(serializedKeystore);
                _this.address = _this.keystore.getAddresses()[0];
                _this.proxyAddress = '0xb33f..'; // TODO implement
                var loadedUser = {
                    address: _this.address,
                    proxyAddress: _this.proxyAddress,
                    keystore: _this.keystore.serialize()
                };
                resolve(loadedUser);
            }
            else {
                reject(new Error('No valid keystore'));
            }
        });
    };
    User.prototype.signTx = function (rawTx) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.keystore.keyFromPassword(_this._password, function (err, pwDerivedKey) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(lightwallet.signing.signTx(_this.keystore, pwDerivedKey, rawTx, _this.address));
                }
            });
        });
    };
    User.prototype.onboardUser = function (newUser) {
        // TODO: define relay api
    };
    User.prototype.generateKey = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var secretSeed = lightwallet.keystore.generateRandomSeed();
            lightwallet.keystore.createVault({
                password: _this._password,
                seedPhrase: secretSeed
            }, function (err, ks) {
                if (err)
                    reject(err);
                _this.keystore = ks;
                ks.keyFromPassword(_this._password, function (err, pwDerivedKey) {
                    if (err)
                        reject(err);
                    _this.keystore.generateNewAddress(pwDerivedKey);
                    var address = _this.keystore.getAddresses()[0];
                    resolve(address);
                });
            });
        });
    };
    User.prototype.deserializeKeystore = function (serializedKeystore) {
        return lightwallet.keystore.deserialize(serializedKeystore);
    };
    return User;
}());
export { User };
//# sourceMappingURL=User.js.map