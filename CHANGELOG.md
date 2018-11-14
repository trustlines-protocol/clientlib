# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/).


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
