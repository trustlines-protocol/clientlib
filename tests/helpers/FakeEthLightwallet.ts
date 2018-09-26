import { Web3TxReceipt, RawTxObject } from '../../src/typings'
import { keystore1 } from '../Fixtures'

/**
 * Mock of eth-lightwallet for testing purposes.
 */
export class FakeEthLightwallet {
  public keystore
  public encryption
  public signing
  public txutils
  public upgrade
  public errors

  private _seed = 'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'
  private _pwDerivedKey = ''
  private _pubKey = 'a5da0d9516c483883256949c3cac6ed73e4eb50ca85f7bdc2f360bbbf9e2d472'
  private _privateKey = '3a1076bf45ab87712ad64ccb3b10217737f7faacbf2872e88fdd9a537d8fe266'

  constructor () {
    this.errors = []
    this.keystore = {
      serialize: () => this._serialize(),
      deserialize: serializedKeystore => this._deserialize(serializedKeystore),
      keyFromPassword: (password, callback) => this._keyFromPassword(password, callback),
      exportPrivateKey: (address, pwDerivedKey) => this._exportPrivateKey(address, pwDerivedKey),
      createVault: (options, callback) => this._createVault(options, callback),
      generateRandomSeed: () => this._generateRandomSeed(),
      generateNewAddress: pwDerivedKey => this._generateNewAddress(pwDerivedKey),
      getAddresses: () => this._getAddresses(),
      getSeed: () => this._getSeed(),
      setError: (name) => this.setError(name),
      removeErrors: () => this.removeErrors()
    }
    this.encryption = {
      multiEncryptString: (
        keystore,
        pwDerivedKey,
        plainMsg,
        address,
        theirPubKey
      ) => this._multiEncryptString(
        keystore,
        pwDerivedKey,
        plainMsg,
        address,
        theirPubKey
      ),
      multiDecryptString: (
        keystore,
        pwDerivedKey,
        encMsg,
        theirPubKey,
        address
      ) => this._multiDecryptString(
        keystore,
        pwDerivedKey,
        encMsg,
        theirPubKey,
        address
      ),
      addressToPublicEncKey: (
        keystore,
        pwDerivedKey,
        address
      ) => this._addressToPublicEncKey(
        keystore,
        pwDerivedKey,
        address
      )
    }
    this.signing = {
      signMsgHash: (
        keystore,
        pwDerivedKey,
        personalMsgHashBuff,
        address
      ) => this._signMsgHash(
        keystore,
        pwDerivedKey,
        personalMsgHashBuff,
        address
      ),
      concatSig: (signature) => this._concatSig(signature)
    }
    this.txutils = {
      functionTx: (
        abi,
        functionName,
        args,
        options
      ) => this._functionTx(
        abi,
        functionName,
        args,
        options
      ),
      valueTx: options => this._valueTx(options)
    }
    this.upgrade = {
      upgradeOldSerialized: (
        keystore,
        password,
        callback
      ) => this._upgradeOldSerialized(
        keystore,
        password,
        callback
      )
    }
  }

  /**
   * Sets flag to mock an error for specific method.
   * @param methodName Name of method to set error flag for.
   */
  public setError (methodName) {
    this.errors[methodName] = true
  }

  /**
   * Removes flags to mock errors for all methods.
   */
  public removeErrors () {
    this.errors = []
  }

  /**
   * Mocked lightwallet.txutils methods
   */
  private _functionTx (
    abi,
    functionName,
    args,
    options
  ) {
    if (this.errors['functionTx']) {
      throw new Error('Mocked error in lightwallet.txutils.functionTx()')
    }
    return '0xf86180808401ef364594f0109fc8df283027b6285cc889f5aa624eac1f5580801ca031573280d608f75137e33fc14655f097867d691d5c4c44ebe5ae186070ac3d5ea0524410802cdc025034daefcdfa08e7d2ee3f0b9d9ae184b2001fe0aff07603d9'
  }
  private _valueTx (options) {
    if (this.errors['valueTx']) {
      throw new Error('Mocked error in lightwallet.txutils.valueTx()')
    }
    return '0xf86180808401ef364594f0109fc8df283027b6285cc889f5aa624eac1f5580801ca031573280d608f75137e33fc14655f097867d691d5c4c44ebe5ae186070ac3d5ea0524410802cdc025034daefcdfa08e7d2ee3f0b9d9ae184b2001fe0aff07603d9'
  }

  /**
   * Mocked lightwallet.signing methods
   */
  private _signMsgHash (
    keystore,
    pwDerivedKey,
    personalMsgHashBuff,
    address
  ) {
    if (this.errors['signMsgHash']) {
      throw new Error('Mocked error in lightwallet.signing.signMsgHash')
    }
    return {
      r: new Buffer('r'),
      s: new Buffer('s'),
      v: 24
    }
  }
  private _concatSig (signature) {
    return 'Concat signature'
  }

  /**
   * Mocked lightwallet.keystore methods
   */
  private _serialize () {
    return keystore1
  }
  private _deserialize (serializedKeystore) {
    return this.keystore
  }
  private _keyFromPassword (password, callback) {
    if (this.errors['keyFromPassword']) {
      return callback(new Error('Mocked error in lightwallet.keystore.keyFromPassword()'), undefined)
    }
    return callback(undefined, this._pwDerivedKey)
  }
  private _exportPrivateKey (address, pwDerivedKey) {
    if (this.errors['exportPrivateKey']) {
      throw new Error('Mocked error in lightwallet.keystore.exportPrivateKey')
    }
    return this._privateKey
  }
  private _createVault (options, callback) {
    if (this.errors['createVault']) {
      return callback(new Error('Mocked error in lightwallet.keystore.createVault()'), undefined)
    }
    return callback(undefined, this.keystore)
  }
  private _generateRandomSeed () {
    if (this.errors['generateRandomSeed']) {
      throw new Error('Mocked error in lightwallet.keystore.generateRandomSeed()')
    }
    return this._seed
  }
  private _generateNewAddress (pwDerivedKey) {
    if (this.errors['generateNewAddress']) {
      throw new Error('Mocked error in lightwallet.keystore.generateNewAddress()')
    }
    return
  }
  private _getAddresses () {
    return ['0x11f4d0A3c12e86B4b5F39B213F7E19D048276DAe']
  }
  private _getSeed () {
    if (this.errors['getSeed']) {
      throw new Error('Mocked error in lightwallet.keystore.getSeed()')
    }
    return this._seed
  }

  /**
   * Mocked lightwallet.encryption methods
   */
  private _multiEncryptString (
    keystore,
    pwDerivedKey,
    plainMsg,
    address,
    theirPubKey
  ) {
    if (this.errors['multiEncryptString']) {
      throw new Error('Mocked error in lightwallet.encryption.multiEncryptString')
    }
    return {
      version: 1,
      asymAlg: 'Asym Algorithm',
      symAlg: 'Sym Algorithm',
      symNonce: 'Sym Nonce',
      symEncMessage: 'Encrypted Message',
      encryptedSymKey: 'Encrypted Symmetric Key'
    }
  }
  private _multiDecryptString (
    keystore,
    pwDerivedKey,
    encMsg,
    theirPubKey,
    address
  ) {
    if (this.errors['multiDecryptString']) {
      throw new Error('Mocked error in lightwallet.encryption.multiDecryptString')
    }
    return 'Decrypted Message!'
  }

  private _addressToPublicEncKey (
    keystore,
    pwDerivedKey,
    address
  ) {
    if (this.errors['addressToPublicEncKey']) {
      throw new Error('Mocked error in lightwallet.encryption.addressToPublicEncKey')
    }
    return this._pubKey
  }

  private _upgradeOldSerialized (keystore, password, callback) {
    if (this.errors['upgradeOldSerialized']) {
      return callback(new Error('Mocked error in lightwallet.upgrade.upgradeOldSerialized()'), undefined)
    }
    return callback(undefined, keystore1)
  }
}
