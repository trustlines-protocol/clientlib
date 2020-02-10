# Interface: TLNetworkConfig

Configuration object for a TLNetwork instance

## Hierarchy

- **TLNetworkConfig**

## Index

### Properties

- [chainId](_typings_.tlnetworkconfig.md#optional-chainid)
- [host](_typings_.tlnetworkconfig.md#optional-host)
- [identityFactoryAddress](_typings_.tlnetworkconfig.md#optional-identityfactoryaddress)
- [identityImplementationAddress](_typings_.tlnetworkconfig.md#optional-identityimplementationaddress)
- [path](_typings_.tlnetworkconfig.md#optional-path)
- [port](_typings_.tlnetworkconfig.md#optional-port)
- [protocol](_typings_.tlnetworkconfig.md#optional-protocol)
- [relayApiUrl](_typings_.tlnetworkconfig.md#optional-relayapiurl)
- [relayWsApiUrl](_typings_.tlnetworkconfig.md#optional-relaywsapiurl)
- [walletType](_typings_.tlnetworkconfig.md#optional-wallettype)
- [web3Provider](_typings_.tlnetworkconfig.md#optional-web3provider)
- [wsProtocol](_typings_.tlnetworkconfig.md#optional-wsprotocol)

## Properties

### `Optional` chainId

• **chainId**? : _number_

Chain id used in the signature of meta-tx

---

### `Optional` host

• **host**? : _string_

Host of a relay server

---

### `Optional` identityFactoryAddress

• **identityFactoryAddress**? : _string_

Address of the identity factory

---

### `Optional` identityImplementationAddress

• **identityImplementationAddress**? : _string_

Address of the implementation of the identity contract

---

### `Optional` path

• **path**? : _string_

Base path for the relay api

---

### `Optional` port

• **port**? : _number_

Port for communication

---

### `Optional` protocol

• **protocol**? : _string_

Protocol for communicating with a relay server

---

### `Optional` relayApiUrl

• **relayApiUrl**? : _string_

Full URL for relay rest api

---

### `Optional` relayWsApiUrl

• **relayWsApiUrl**? : _string_

Full URL for relay WebSocket api

---

### `Optional` walletType

• **walletType**? : _string_

Wallet type to use, either "WalletTypeEthers" or "WalletTypeIdentity".

---

### `Optional` web3Provider

• **web3Provider**? : _any_

Web3 provider

---

### `Optional` wsProtocol

• **wsProtocol**? : _string_

Protocol for WebSockets
