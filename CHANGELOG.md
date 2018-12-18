# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).

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
