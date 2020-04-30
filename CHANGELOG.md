# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Changed

- Use `feeRecipient` as given by the provider instead of zeroAddress for meta-tx

### Added

- Add function to get the delegation fees paid in transaction: `Transaction.getAppliedDelegationFees(txHash)`.
  It returns a list of all delegation fees applied in transaction with given hash
  where the fee payer is the loaded user
- Add `extraData` to `TransferDetails`, it contains the raw `extraData` that was present in the transfer
  for which details are returned

## [0.13.0] - 2020-04-23

(requires relay version >=0.15.0)

### Changed

- Transaction prepare functions do not return `ethFees` and `delegationFees` anymore, instead they return `txFees` always,
  which represent the chain coin fees or delegation fees depending on which wallet type was used.
  The following fields exist: `totalFee`, `baseFee`, `gasLimit`, `gasPrice`, `feeRecipient`(`null`, if not set),
  `currencyNetworkOfFees`(`null`, if not set). (BREAKING)
- Transaction fees will now have `null` `currencyNetworkOfFees` when delegation fees are zero instead of `zeroAddress` (BREAKING)
- Meta transactions will now use `feeRecipient` given by the relay provider (BREAKING)
- Use `user` and `counterparty` instead of `address` for TrustlineObject and TrustlineRaw types.
  The previous `address` now corresponds to `counterparty` (BREAKING)
- Use gas limits from contracts tests for transactions and meta transactions
- Change link schema and api (`X.createLink`) to allow for easier addition of optional data (BREAKING)

### Added

- Added function to get trustline balance updates `Trustline.getTrustlineBalanceUpdates` (Requires relay server >=v0.15.0)
- Added function to get transfer details `Payment.getTransferDetails` either from tx hash or event identifier: (blockHash, logIndex)
  (Requires relay server >=v0.15.0)
- Events now include `blockHash` and `logIndex` (Requires relay server >=v0.15.0)
- Added function to decline payment requests `Messaging.paymentRequestDecline`
- Added function to check for tx status via tx hash or meta-tx status either via enveloping tx-hash or raw-tx `Transaction.getTxStatus`

### Deprecated

- `transactionId` on events is deprecated for `transactionHash`. (Based on relay server deprecations)

## [0.12.1] - 2020-02-20

### Changed

- Updated default values for meta transaction fees to use valid zero address in case the relay does not return any

## [0.12.0] - 2020-02-19

### Changed

- `TLNetwork` now uses two distinct urls for messaging and relay in its config (BREAKING)
- Updated initcode of identity proxy to match new contracts version, this changes the address of deployed identities (BREAKING)
- Updated meta-transaction fields to match new contracts feature (BREAKING) New fields: chainId, version, baseFee, gasPrice, gasLimit, feeRecipient, timeLimit, operationType. Fields removed: delegationFees, extraData

### Added

- Added method `getAllOfUser()` in `Trustline` to get all trustlines of loaded user
- Added caching for getting the decimals of a currency network
- Enabled websocket stream subscribers to handle websocket errors
- Added function `getUserAccruedInterests` in `Information` to get all accrued interests of user
- Added function `getTrustlineAccruedInterests` in `Information` to get all accrued interests of trustline

## [0.11.0] - 2020-01-13

### Changed

- Make `User.createLink()` synchronous (BREAKING)
- Make `Contract.createLink()` synchronous (BREAKING)
- `Transaction` now takes a `CurrencyNetwork` as argument to be able to get the decimals for delegationFees (BREAKING)

### Added

- Added function `Trustline.prepareCancelTrustlineUpdate()` to reject or cancel trustline update requests
- Added function `Trustline.getCancels()` to get TrustlineUpdateCancel events for user
- Function `Payment.prepareEth()`, `Transaction.prepareContractTransaction()`, `Transaction.prepareValueTransaction()`,
  `Trustline.prepareUpdate()`, `Trustline.prepareAccept()`, `Trustline.prepareClose()`, now return `delegationFees` that could be used for a meta-tx
- Added utils functions to format and convert delegation fees
- Added option to `Transaction.prepareContractTransaction()` for providing delegation fees
- Added function `TLProvider.getMetaTxFees()` and `TLProvider.getRelayVersion()`
- Added function `sendUsernameToCounterparty()`
- Added infos about whether a network is frozen to network details

## [0.10.0] - 2019-11-05

### Changed

- Changed how internal payload of messages is formated. (BREAKING)
- Changed user api of how to load and create the wallets (BREAKING)

### Removed

- Removed estimateGas field of pathfinding functions (BREAKING)

## [0.9.0] - 2019-10-05

### Added

- Added function to deploy an identity contract
- Added function to check if identity contract is deployed
- Implemented recover from seed for identity wallet

### Changed

- Changed user.create will no longer deploy an identity contract (BREAKING)
- Changed config of clientlib will need the factory address and the implementation address to configure the identity wallet (BREAKING)

## [0.8.0] - 2019-10-01

### Changed

- Changed metatransaction to now take a fee parameter (BREAKING)
- Changed have default value for freeze feature

### Fixed

- Fix build issue on mac with fsevents

## [0.7.0] - 2019-09-03

### Added

- Added `frozenBalance` to UserOverview to return the sum of all frozen balances for a user's trustlines
- Added `isFrozen` to trustline events
- Added `isFrozen` to `prepareUpdate` and `prepareAccept` options argument to freeze a trustline (BREAKING)

## [0.6.0] - 2019-08-08

### Added

- Added `extraData` to `PaymentOptions` for transfers, used for logging arbitrary data (BREAKING)
- Added `extraData` to queried transfer events (BREAKING)

## [0.5.1] - 2019-08-08

### Added

- Added `DecimalsOptions` to avoid querying decimals from the server when not necessary

## [0.5.0] - 2019-06-25

### Added

- `messaging.paymentRequest` returns sent payment request so that the sender can keep track of sent requests

## [0.4.3] - 2019-05-29

### Changed

- New base URL `trustlines://` for all created links
- Additional optional custom base url parameter for `contact.createLink` and `payment.createRequest`

## [0.4.2] - 2019-04-18

### Changed

- Dependency update of `reconnecting-websocket`

### Fixed

- `Object is not a constructor (new ReconnectingWebSocket)` bug in react-native

## [0.4.1] - 2019-04-17

### Fixed

- `Can not resolve module child_process` bug in react-native

## [0.4.0] - 2019-04-10

### Added

- Additional option `feePayer` in `payment.prepare` which specifies who pays network fees for transfer
- `IdentityWallet` for creating and interacting with identity contracts
- Additional configuration option `walletType` for initializing `TLNetwork` instance
  - Defaults to `'WalletTypeEthers'`
  - When using `'WalletTypeIdentity'` it enables meta-transactions which are relayed by configured relay server
- Basic example app for using clientlib with injected web3 instance via MetaMask under `/examples/injected-web3`

### Changed

- Copyright transferred to trustlines foundation
- Every call to `user.address` has been replaced with `await user.getAddress`

### Fixed

- Bug when using `Web3Signer` via MetaMask which referenced an empty address
- Wrong devDependency of `reconnecting-websocket` which should be a normal dependency

### BREAKING

- Removed obsolete parameters `serializedWallet` and `progressCallback` in `user.createOnboardingMsg` (only mandatory parameter is now `username`)

## [0.3.0] - 2019-02-15

Minor breaking change due to migration to `ethers.js`. The API itself did not change, but keystore files of previous versions are not compatible with the new library.

### Added

- Basic unit tests
- `ethers.js` library and support
- Optional `progressCallback` for creating and loading `user` instances

### Changed

- Change CI provider to `CircleCI`
- Build and deploy docker image for `end2end` tests
- Migration to `ethers.js` for wallet, signer and provider functionalities

### Removed

- `eth-lighwallet` and `web3` dependencies
- `TravisCI` config files
- `/tests/testrelay` files

## [0.2.2] - 2018-12-18

### Added

- `build`, `npm` and `coverage` shields to README
- Linter and pre-commit hooks: `prettier`, `lint-staged` and `husky`
- Code coverage tools: `nyc` and `codecov`

### Changed

- Use `contracts.json` from npm

### Fixed

- `trustline.prepareUpdate` now uses either `updateCreditlimits` or `updateTrustline` (see [#150](https://github.com/trustlines-network/clientlib/issues/150))
- `trustline.prepareClose` handles cases where balance is 0 (see [#151](https://github.com/trustlines-network/clientlib/issues/151))

### Removed

- Local `contracts.json` file
- `package-lock.json` (only maintaining `yarn.lock`)

## [0.2.1] - 2018-11-15

### Changed

- `bump.sh` script for bumping version

## [0.2.0] - 2018-11-15

Updated minor version of library as breaking changes were introduced in `0.1.4`.

### Fixed

- Fix decimals bug in `trustline.prepareClose`

## [0.1.4] - 2018-11-14

### Added

- Unit tests for `LightwalletSigner` and `Web3Signer`
- Interest rates feature
- Close trustline feature
  - `trustline.prepareClose()`
  - `trustline.getClosePath()`

### Changed

- Update docker setup for e2e tests
- Update contracts abi
- Update `currencyNetwork.getInfo()` to return interest rate related information
- Update `currencyNetwork.getDecimals()` to support interest rate decimals
- Add attributes `interestRateGiven` and `interestRateReceived` to trustline related events

## [0.1.3] - 2018-08-22

### Added

- Start using changelog
- Fluid publish of most recent develop version of library to npm via travis
- New method `Payment.getMaxAmountAndPathInNetwork(networkAddress, receiverAddress)`

### Changed

- Update vulnerable dependencies
