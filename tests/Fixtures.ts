import { BigNumber } from 'bignumber.js'
import { ethers } from 'ethers'

import { TLNetwork } from '../src/TLNetwork'
import {
  WALLET_TYPE_ETHERS,
  WALLET_TYPE_IDENTITY
} from '../src/wallets/TLWallet'

import identityConfig from './e2e-config/addresses.json'

import {
  Amount,
  EthersWalletData,
  IdentityWalletData,
  MetaTransaction,
  ProviderUrl,
  RawTxObject,
  TLNetworkConfig,
  TLWalletData,
  TransactionStatus,
  TransactionStatusObject,
  TxObjectInternal
} from '../src/typings'

export const end2endChainId = 17

export const identityFactoryAddress = identityConfig.identityProxyFactory

export const identityImplementationAddress =
  identityConfig.identityImplementation

export const providerUrl: ProviderUrl = {
  host: process.env.RELAY_HOSTNAME || 'localhost',
  path: 'api/v1/',
  port: 5000,
  protocol: 'http'
}

export const tlNetworkConfig: TLNetworkConfig = {
  relayUrl: providerUrl,
  messagingUrl: providerUrl,
  chainId: end2endChainId
}

export const tlNetworkConfigIdentity: TLNetworkConfig = {
  relayUrl: providerUrl,
  messagingUrl: providerUrl,
  walletType: WALLET_TYPE_IDENTITY,
  identityFactoryAddress: identityConfig.identityProxyFactory,
  identityImplementationAddress: identityConfig.identityImplementation,
  chainId: end2endChainId
}

export const parametrizedTLNetworkConfig = [
  { config: tlNetworkConfig, walletType: 'Ethers' },
  { config: tlNetworkConfigIdentity, walletType: 'Identity' }
]

export const extraData = '0x12ab34ef'

export async function createAndLoadUsers(tlInstances: TLNetwork[]) {
  return Promise.all(
    tlInstances.map(async tl => {
      const walletData = await tl.user.create()
      await tl.user.loadFrom(walletData)
      return walletData
    })
  )
}

export async function deployIdentities(tlInstances: TLNetwork[]) {
  return Promise.all(tlInstances.map(tl => tl.user.deployIdentity()))
}

export function requestEth(tlInstances) {
  return Promise.all(tlInstances.map(tl => tl.user.requestEth()))
}

export async function setTrustlines(networkAddress, tl1, tl2, given, received) {
  const [tx1, tx2] = await Promise.all([
    tl1.trustline.prepareUpdate(
      networkAddress,
      tl2.user.address,
      given,
      received
    ),
    tl2.trustline.prepareUpdate(
      networkAddress,
      tl1.user.address,
      received,
      given
    )
  ])
  await Promise.all([
    tl1.trustline.confirm(tx1.rawTx),
    tl2.trustline.confirm(tx2.rawTx)
  ])
  await wait()
  return
}

export function wait(ms = 2000) {
  return new Promise(resolve => setTimeout(() => resolve(), ms))
}

// NOTE: Encrypted with 'ts'
export const ETHERS_JSON_KEYSTORE_1 = `{"address":"f9fd1daf400404a62b8cdcb1834317894c714625","id":"58f882de-6c78-4ef5-a260-ea41078080a5","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"3b2df3f31c4a65e3b0f932199b6fca91"},"ciphertext":"64aeb97e2bbac76e92535ba770c18caaf4e54b2aa383912b205079d587f35809","kdf":"scrypt","kdfparams":{"salt":"c0e4776c2e04d134c02d8310e542e74f151b8dc288e6e194d20fc1f1e894257e","n":131072,"dklen":32,"p":1,"r":8},"mac":"af27838802b5095713c2127b932ad049c873f9b6498586fa4e4b00ca0b6c8b89"},"x-ethers":{"client":"ethers.js","gethFilename":"UTC--2019-01-29T09-34-34.0Z--f9fd1daf400404a62b8cdcb1834317894c714625","mnemonicCounter":"0ffc0cd7eab7e49dc2ef31d14e67be4b","mnemonicCiphertext":"0dc419d4eb3b37f5f0d0a815f4cdbeb6","version":"0.1"}}`
export const ETHERS_JSON_KEYSTORE_2 = `{"address":"21b07ba7af3688270cd6ec3f58f4b565fc8784f1","id":"35cca2ab-94d4-4176-a720-2d6ec2f50126","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"4b5a4b705e7b4118bca20950358ee647"},"ciphertext":"dfa85ec83411225c41229f9f125a065ac980c6824ab51053b408094ffad18a52","kdf":"scrypt","kdfparams":{"salt":"0b9d2cb7dc928a124f8dac54ce1a93773dad1a7fdf9e8956cb828e856b09ae01","n":131072,"dklen":32,"p":1,"r":8},"mac":"95bca4f6c91e2f5c70cf2e0ee0b2cc64f14367aa3d3ab4ba2956f09054e237ed"},"x-ethers":{"client":"ethers.js","gethFilename":"UTC--2019-01-29T11-19-08.0Z--21b07ba7af3688270cd6ec3f58f4b565fc8784f1","mnemonicCounter":"4ee2894cad48c1fd5169b77372fb0f11","mnemonicCiphertext":"2a4c719dca87236c01ff07c47479eec3","version":"0.1"}}`
export const ETHERS_JSON_KEYSTORE_3 = `{"address":"bc2b254c2b6a3cb288940e1b0cc7656bbb56aa95","id":"92948846-b0c6-4515-8ec1-4917be740779","version":3,"Crypto":{"cipher":"aes-128-ctr","cipherparams":{"iv":"b9f2d9502297108dbe6ec5c5a99c1cca"},"ciphertext":"522e8a3333db4dbda7ac1c0ee34b1861c85331b764200f1649c8bee4f1f2e620","kdf":"scrypt","kdfparams":{"salt":"12bfecec25bf42db1d22817f9e2efb94b8def753b487c5a3d1b2da9208425a0e","n":131072,"dklen":32,"p":1,"r":8},"mac":"bb9e73e2e0cb7ccecade6f5655663f0b1b261e72c58b1bae289408462e4a5de1"},"x-ethers":{"client":"ethers.js","gethFilename":"UTC--2019-01-29T11-27-58.0Z--bc2b254c2b6a3cb288940e1b0cc7656bbb56aa95","mnemonicCounter":"d2e098a9ae633867463cb37022c450c9","mnemonicCiphertext":"b301d4f40302f10eec6da03c934b958a","version":"0.1"}}`

export const TL_WALLET_DATA: TLWalletData = {
  version: 1,
  type: WALLET_TYPE_ETHERS,
  address: '0x',
  meta: {}
}

export const USER_1_ADDRESS = '0xF9fD1DaF400404A62B8cDCb1834317894c714625'
export const USER_1_IDENTITY_ADDRESS =
  '0x489a79e88fB0412543e09ff892C96c2f0Fdba71b'
export const USER_1 = {
  address: USER_1_ADDRESS,
  keystore: ETHERS_JSON_KEYSTORE_1,
  mnemonic:
    'deer cave charge core farm retire daughter peanut project multiply smart wash',
  password: 'ts',
  privateKey:
    '0xf6692380c18c54bba568dcfcb825ae89dafe16cdcea65e68fdf7e85bde5d8bf0',
  derivationPath: `m/44'/60'/0'/0/0`,
  identityAddress: USER_1_IDENTITY_ADDRESS
}

export const USER_2 = {
  address: '0x21b07bA7Af3688270cd6Ec3f58f4b565fc8784F1',
  keystore: ETHERS_JSON_KEYSTORE_2,
  password: 'ts'
}

export const USER_3 = {
  address: '0xbC2B254C2B6A3cB288940e1b0CC7656Bbb56AA95',
  keystore: ETHERS_JSON_KEYSTORE_3,
  password: 'ts'
}

export const USER_1_ETHERS_WALLET_V1: EthersWalletData = {
  address: USER_1.address,
  version: 1,
  type: WALLET_TYPE_ETHERS,
  meta: {
    signingKey: {
      privateKey: USER_1.privateKey,
      mnemonic: USER_1.mnemonic
    }
  }
}

export const USER_1_IDENTITY_WALLET_V1: IdentityWalletData = {
  address: USER_1.identityAddress,
  version: 1,
  type: WALLET_TYPE_IDENTITY,
  meta: {
    signingKey: {
      privateKey: USER_1.privateKey,
      mnemonic: USER_1.mnemonic
    }
  }
}

export const IDENTITY_FACTORY_ADDRESS =
  '0x8688966AE53807c273D8B9fCcf667F0A0a91b1d3'
export const IDENTITY_IMPLEMENTATION_ADDRESS =
  '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
export const IDENTITY_OWNER_ADDRESS =
  '0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf'
export const IDENTITY_ADDRESS = '0x7025175Ac3537be29f764bbeAB26d5f89b0F49aC'

export const FAKE_NETWORK = {
  abbreviation: 'CASH',
  address: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  customInterests: false,
  decimals: 2,
  defaultInterestRate: {
    decimals: 3,
    raw: '10',
    value: '0.01'
  },
  interestRateDecimals: 3,
  name: 'Cash',
  numUsers: 100,
  isFrozen: false
}

export const FAKE_USER_ADDRESSES = [
  '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
  '0xc7D6401b81A2F70C5906e8A6FBEbE680c69fA03D'
]

export const FAKE_AMOUNT = {
  decimals: 2,
  raw: '100',
  value: '1'
}

export const FAKE_USER = {
  balance: 100,
  balanceFrozen: 100,
  given: 300,
  leftGiven: 100,
  leftReceived: 400,
  received: 300
}

export const FAKE_IDENTITY = {
  balance: '1000',
  identity: USER_1_IDENTITY_ADDRESS,
  nextNonce: 10
}

export const FAKE_VALUE_TX_OBJECT_INTERNAL: TxObjectInternal = {
  txFees: {
    gasPrice: FAKE_AMOUNT,
    gasLimit: FAKE_AMOUNT,
    baseFee: FAKE_AMOUNT,
    totalFee: {
      decimals: 18,
      raw: '1000000000000000000',
      value: '1'
    }
  },
  rawTx: {
    from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
    gasLimit: new BigNumber(6000000),
    gasPrice: new BigNumber(1000000),
    nonce: 100,
    to: '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
    value: new BigNumber(1000000)
  }
}

export const FAKE_FUNC_TX_OBJECT_INTERNAL: TxObjectInternal = {
  txFees: {
    gasPrice: FAKE_AMOUNT,
    gasLimit: FAKE_AMOUNT,
    baseFee: FAKE_AMOUNT,
    totalFee: {
      decimals: 18,
      raw: '1000000000000000000',
      value: '1'
    }
  },
  rawTx: {
    from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
    gasLimit: new BigNumber(6000000),
    gasPrice: new BigNumber(1000000),
    nonce: 100,
    to: '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
    value: new BigNumber(1000000)
  }
}

export const FAKE_TX_HASH =
  '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b'

export const FAKE_SIGNED_TX =
  '0xf86b028511cfc15d00825208940975ca9f986eee35f5cbba2d672ad9bc8d2a08448766c92c5cf830008026a0d2b0d401b543872d2a6a50de92455decbb868440321bf63a13b310c069e2ba5ba03c6d51bcb2e1653be86546b87f8a12ddb45b6d4e568420299b96f64c19701040'

export const FAKE_SIGNED_MSG_HASH = {
  concatSig: 'Fake concat signature',
  ecSignature: {
    r: '0x',
    s: '0x',
    v: 24
  }
}

export const FAKE_ENC_OBJECT = {
  asymAlg: 'Asym Algorithm',
  encryptedSymKey: 'Encrypted Symmetric Key',
  symAlg: 'Sym Algorithm',
  symEncMessage: 'Encrypted Message',
  symNonce: 'Sym Nonce',
  version: 1
}

export const FAKE_SEED =
  'mesh park casual casino sorry giraffe half shrug wool anger chef amateur'

export const FAKE_PRIVATE_KEY =
  '3a1076bf45ab87712ad64ccb3b10217737f7faacbf2872e88fdd9a537d8fe266'

export const FAKE_DECIMALS = {
  interestRateDecimals: 3,
  networkDecimals: 2
}

export const FAKE_TRANSFER_EVENT = {
  amount: '150',
  blockNumber: 123,
  counterParty: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  direction: 'sent',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  networkAddress: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  status: 'pending',
  timestamp: 123456789,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  transactionHash:
    '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
  type: 'Transfer',
  user: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
}

export const FAKE_FORMATTED_TRANSFER_EVENT = {
  amount: {
    decimals: 2,
    raw: '123',
    value: '1.23'
  },
  blockNumber: 123,
  counterParty: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  direction: 'sent',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  networkAddress: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  status: 'pending',
  timestamp: 123456789,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  transactionHash:
    '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
  type: 'Transfer',
  user: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  extraData
}

export const FAKE_TRUSTLINE_UPDATE_REQUEST_EVENT = {
  blockNumber: 123,
  counterParty: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  direction: 'sent',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  given: 100,
  interestRateGiven: 1,
  interestRateReceived: 1,
  networkAddress: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  received: 200,
  status: 'pending',
  timestamp: 123456789,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  transactionHash:
    '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
  type: 'TrustlineUpdateRequest',
  user: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
}

export const FAKE_TRUSTLINE_UPDATE_EVENT = {
  blockNumber: 123,
  counterParty: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  direction: 'sent',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  given: 100,
  interestRateGiven: 1,
  interestRateReceived: 1,
  networkAddress: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  received: 200,
  status: 'pending',
  timestamp: 123456789,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  transactionHash:
    '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
  type: 'TrustlineUpdate',
  user: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
}

export const FAKE_TRUSTLINE_CANCEL_EVENT = {
  blockNumber: 123,
  counterParty: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  direction: 'sent',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  networkAddress: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  status: 'pending',
  timestamp: 123456789,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  transactionHash:
    '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
  type: 'TrustlineUpdateCancel',
  user: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
}

export const FAKE_TOKEN_EVENT = {
  amount: '150',
  blockNumber: 123,
  counterParty: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  direction: 'sent',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  status: 'pending',
  timestamp: 123456789,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  tokenAddress: '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
  transactionHash:
    '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
  type: 'Transfer',
  user: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
}

export const FAKE_FILL_EVENT = {
  blockNumber: 123,
  counterParty: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  direction: 'sent',
  exchangeAddress: '0xc7D6401b81A2F70C5906e8A6FBEbE680c69fA03D',
  filledMakerAmount: '150',
  filledTakerAmount: '150',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  makerTokenAddress: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  status: 'pending',
  takerTokenAddress: '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
  timestamp: 123456789,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  transactionHash:
    '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
  type: 'LogFill',
  user: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
}

export const FAKE_CANCEL_EVENT = {
  blockNumber: 123,
  cancelledMakerAmount: '150',
  cancelledTakerAmount: '150',
  counterParty: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  direction: 'sent',
  exchangeAddress: '0xc7D6401b81A2F70C5906e8A6FBEbE680c69fA03D',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  makerTokenAddress: '0xcE2D6f8bc55A61428D32947bC9Bc7F2DE1640B18',
  status: 'pending',
  takerTokenAddress: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  timestamp: 123456789,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  transactionHash:
    '0x9fc76417374aa880d4449a1f7f31ec597f00b1f6f3dd2d66f4c9c6c445836d8b',
  type: 'LogCancel',
  user: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'
}

export const FAKE_TX_INFOS = {
  balance: new BigNumber('2000000'),
  gasPrice: new BigNumber('2000000'),
  nonce: 12
}

export const FAKE_TX_STATUS_OBJECT: TransactionStatusObject = {
  status: TransactionStatus.Success
}

export const FAKE_WEB3_TX_INFOS = {
  balance: new ethers.utils.BigNumber('2000000'),
  gasPrice: new ethers.utils.BigNumber('2000000'),
  nonce: 12
}

export const FAKE_CHAIN_ID = 17

// This meta_tx corresponds to a meta-tx signed in the contracts test and is used to verify that the signatures match
export const FAKE_META_TX: MetaTransaction = {
  data:
    '0x46432830000000000000000000000000000000000000000000000000000000000000000a',
  from: '0xF2E246BB76DF876Cef8b38ae84130F4F55De395b',
  chainId: 0,
  version: 1,
  nonce: '1',
  timeLimit: '123456',
  operationType: 0,
  to: '0x51a240271AB8AB9f9a21C82d9a85396b704E164d',
  value: '0',
  baseFee: '1',
  gasPrice: '123',
  gasLimit: '456',
  feeRecipient: '0xF2E246BB76DF876Cef8b38ae84130F4F55De395b',
  currencyNetworkOfFees: '0x51a240271AB8AB9f9a21C82d9a85396b704E164d'
}

export const FAKE_META_TX_PRIVATE_KEY =
  '0x0000000000000000000000000000000000000000000000000000000000000001'

// The signature on the FAKE_META_TX obtained in the tests of the trustlines-network/contracts repository
// Obtained by signing with key "0x0000...001"
export const FAKE_META_TX_SIGNATURE =
  '0x639db755a4e0642c2ec76485cf623c58b635c54f9ce375088fad40a128779d7a060ceb63129eb9681216a844a0577184b1d3266fc6ac00fbbe23e72b592c33c200'

export const FAKE_TRUSTLINE = {
  address: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  balance: '-100',
  given: '100',
  id: '123456798',
  interestRateGiven: '1',
  interestRateReceived: '1',
  isFrozen: false,
  leftGiven: '200',
  leftReceived: '0',
  received: '100'
}

export const FAKE_CLOSE_PATH_RAW = {
  feePayer: 'sender',
  fees: '1000000',
  path: ['0xf8E191d2cd72Ff35CB8F012685A29B31996614EA'],
  value: '123'
}

export const FAKE_RELAY_API = 'http://relay.network/api/v1'

export const FAKE_SIGNED_MESSAGE =
  '0xea09d6e94e52b48489bd66754c9c02a772f029d4a2f136bba9917ab3042a0474301198d8c2afb71351753436b7e5a420745fed77b6c3089bbcca64113575ec3c1c'

export const FAKE_RAW_TX_OBJECT = {
  data: '0x7f9fade1c0d57a7af66ab4ead79fade1c0d57a7af66ab4ead7c2c2eb7b11a91385',
  from: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  gasLimit: 10000,
  gasPrice: 10000,
  nonce: 5,
  to: '0xf8E191d2cd72Ff35CB8F012685A29B31996614EA',
  value: 10000
}

export const FAKE_ETHERS_TX_RECEIPT = {
  byzantium: false
}

export const FAKE_ETHERS_TX_RESPONSE = {
  chainId: 69,
  confirmations: 1,
  data: '0xc0de',
  from: USER_2.address,
  gasLimit: ethers.utils.bigNumberify('1000000'),
  gasPrice: ethers.utils.bigNumberify('1000000'),
  hash: FAKE_TX_HASH,
  nonce: 12,
  raw: FAKE_SIGNED_TX,
  to: USER_1.address,
  value: ethers.utils.bigNumberify('10000000'),
  wait: (confirmations?: number) => Promise.resolve(FAKE_ETHERS_TX_RECEIPT)
}

export const TL_WALLET_DATA_KEYS = ['version', 'type', 'meta', 'address']
export const TL_WALLET_DATA_META_KEYS = ['signingKey']
export const DEFAULT_PASSWORD = 'ts'
export const AMOUNT_KEYS = ['raw', 'value', 'decimals']
