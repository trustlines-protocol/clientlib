# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

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

### Removed

- Obsolete parameters `serializedWallet` and `progressCallback` in `user.createOnboardingMsg`

### Fixed

- Bug when using `Web3Signer` via MetaMask which referenced an empty address
- Wrong devDependency of `reconnecting-websocket` which should be a normal dependency

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
