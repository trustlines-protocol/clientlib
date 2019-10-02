import { isValidAddress } from 'ethereumjs-util'
import { ethers, utils as ethersUtils } from 'ethers'

import { TLProvider } from '../providers/TLProvider'
import { TL_WALLET_VERSION, TLWallet, WALLET_TYPE_IDENTITY } from './TLWallet'

import {
  Amount,
  DeployIdentityResponse,
  IdentityWalletSchema,
  MetaTransaction,
  RawTxObject,
  Signature,
  TxInfos,
  UserObject
} from '../typings'

import utils from '../utils'

const initcodeWithPadding =
  '0x608060405234801561001057600080fd5b5060405160208061023c8339810180604052602081101561003057600080fd5b50506101fb806100416000396000f3fe6080604052600436106100295760003560e01c80636d7203cb1461005c578063d784d4261461008d575b600080546040516001600160a01b0390911691369082376000803683855af43d6000833e808015610058573d83f35b3d83fd5b34801561006857600080fd5b506100716100c2565b604080516001600160a01b039092168252519081900360200190f35b34801561009957600080fd5b506100c0600480360360208110156100b057600080fd5b50356001600160a01b03166100d1565b005b6000546001600160a01b031681565b6000546001600160a01b031661010e576000805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b03831617905561018f565b333014610166576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603d815260200180610193603d913960400191505060405180910390fd5b6000805473ffffffffffffffffffffffffffffffffffffffff19166001600160a01b0383161790555b5056fe54686520696d706c656d656e746174696f6e2063616e206f6e6c79206265206368616e6765642062792074686520636f6e747261637420697473656c66a165627a7a723058207cd2968997410c5053b2fe83b3875cbaca17001f398f7eb6871746a38a8970e90029000000000000000000000000'

export class IdentityWallet implements TLWallet {
  public provider: TLProvider

  private wallet: ethers.Wallet
  private identityAddress: string
  private identityFactoryAddress: string
  private identityImplementationAddress: string

  constructor(
    provider: TLProvider,
    { identityFactoryAddress, identityImplementationAddress }
  ) {
    this.identityFactoryAddress = identityFactoryAddress
    this.identityImplementationAddress = identityImplementationAddress
    this.provider = provider
  }

  public get address(): string {
    return this.identityAddress
  }

  public get pubKey(): string {
    throw new Error('Method not implemented.')
  }

  public async getAddress(): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    return this.address
  }

  public async getBalance(): Promise<Amount> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    const balance = await this.provider.fetchEndpoint<string>(
      `users/${this.address}/balance`
    )
    return utils.formatToAmount(utils.calcRaw(balance, 18), 18)
  }

  /**
   * Creates a new wallet and encrypts it with the provided password.
   * @param password Password to encrypt wallet.
   * @param progressCallback Callback function for encryption progress.
   */
  public async createAccount(
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = ethers.Wallet.createRandom()
    this.identityAddress = calculateIdentityAddress(
      this.identityFactoryAddress,
      this.wallet.address
    )

    const encryptedKeystore = await this.wallet.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    const serializedWallet: string = this.serializeWallet(
      encryptedKeystore,
      this.identityAddress
    )

    return {
      address: this.address,
      pubKey: 'Not implemented yet',
      serializedWallet
    }
  }

  /**
   * Deploys a new identity contract on the chain
   */
  public async deployIdentity(): Promise<string> {
    const messageHash: string = ethers.utils.solidityKeccak256(
      ['bytes1', 'bytes1', 'address', 'address'],
      [
        '0x19',
        '0x00',
        this.identityFactoryAddress,
        this.identityImplementationAddress
      ]
    )
    const signature = await this.rawSignHash(messageHash)

    const deployIdentityEndpoint = 'identities'
    const response = await this.provider.postToEndpoint<DeployIdentityResponse>(
      deployIdentityEndpoint,
      {
        implementationAddress: this.identityImplementationAddress,
        factoryAddress: this.identityFactoryAddress,
        signature
      }
    )
    if (this.address !== response.identity) {
      throw new Error(
        `Delegate did not deploy the right identity contract. Deployed ${
          response.identity
        } instead of ${this.address}`
      )
    }

    return this.address
  }

  /**
   * Decrypts given serialized wallet and loads wallet.
   * @param serializedWallet serialized wallet from `createAccount`.
   * @param password Password to decrypt wallet.
   * @param progressCallback Callback function for decryption progress.
   */
  public async loadAccount(
    serializedWallet: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    const deserializedWallet: IdentityWalletSchema = JSON.parse(
      serializedWallet
    )

    this.verifyDeserializedWalletHandled(deserializedWallet)

    const encryptedKeystore = deserializedWallet.ethersKeystore
    const identityAddress = deserializedWallet.identityAddress

    this.wallet = await ethers.Wallet.fromEncryptedJson(
      encryptedKeystore,
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    this.identityAddress = identityAddress

    return {
      address: identityAddress,
      pubKey: 'Not implemented yet',
      serializedWallet
    }
  }

  /**
   * Should recover wallet from mnemonic phrase and encrypts it with given password.
   * Method not implemented yet
   * @param seed Mnemonic seed phrase.
   * @param password Password to encrypt recovered wallet.
   * @param progressCallback Callback function for encryption progress.
   */
  public async recoverFromSeed(
    seed: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = ethers.Wallet.fromMnemonic(seed)
    this.identityAddress = calculateIdentityAddress(
      this.identityFactoryAddress,
      this.wallet.address
    )

    const encryptedKeystore = await this.wallet.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    const serializedWallet = this.serializeWallet(
      encryptedKeystore,
      this.identityAddress
    )

    return {
      address: this.address,
      pubKey: 'Not implemented yet',
      serializedWallet
    }
  }

  /**
   * Recovers wallet from private key and encrypts wallet with given password.
   * @param privateKey Private key to recover wallet from.
   * @param password Password to encrypt recovered wallet.
   * @param identityAddress the address of the corresponding identity contract
   * @param progressCallback Callback function for encryption progress.
   */
  public async recoverFromPrivateKey(
    privateKey: string,
    password: string,
    progressCallback?: any
  ): Promise<UserObject> {
    this.wallet = new ethers.Wallet(privateKey)
    this.identityAddress = calculateIdentityAddress(
      this.identityFactoryAddress,
      this.wallet.address
    )

    const encryptedKeystore = await this.wallet.encrypt(
      password,
      typeof progressCallback === 'function' && progressCallback
    )

    const serializedWallet: string = this.serializeWallet(
      encryptedKeystore,
      this.address
    )

    return {
      address: this.address,
      pubKey: 'Not implemented yet',
      serializedWallet
    }
  }

  /**
   * Returns a `Promise` with the mnemonic seed phrase of loaded user.
   */
  public async showSeed(): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    return this.wallet.mnemonic
  }

  /**
   * Returns a `Promise` with the private key of loaded user.
   */
  public async exportPrivateKey(): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }
    return this.wallet.privateKey
  }

  public async encrypt(msg: string, theirPubKey: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  public async decrypt(encMsg: any, theirPubKey: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  public async signMsgHash(msgHash: string): Promise<Signature> {
    throw new Error('Method not implemented.')
  }

  public async signMessage(message: ethers.utils.Arrayish): Promise<Signature> {
    throw new Error('Method not implemented.')
  }

  /**
   * Takes a raw transaction object, turns it into a meta-transaction signed by
   * the loaded user and relays the transaction.
   * @param rawTx Raw transaction object.
   * @returns the hash of the meta-transaction
   */
  public async confirm(rawTx: RawTxObject): Promise<string> {
    this.verifyFromField(rawTx)

    const metaTransaction: MetaTransaction = this.buildMetaTransaction(rawTx)

    await this.signMetaTransaction(metaTransaction)

    return this.provider.sendSignedMetaTransaction(metaTransaction)
  }

  public async signMetaTransaction(
    metaTransaction: MetaTransaction
  ): Promise<string> {
    if (!this.wallet) {
      throw new Error('No wallet loaded.')
    }

    const types = [
      'bytes1',
      'bytes1',
      'address',
      'address',
      'uint256',
      'bytes32',
      'uint64',
      'address',
      'uint256',
      'bytes'
    ]
    const values = [
      '0x19',
      '0x00',
      metaTransaction.from,
      metaTransaction.to,
      metaTransaction.value,
      ethers.utils.solidityKeccak256(['bytes'], [metaTransaction.data]),
      metaTransaction.delegationFees,
      metaTransaction.currencyNetworkOfFees,
      metaTransaction.nonce,
      metaTransaction.extraData
    ]

    const metaTransactionHash: string = ethers.utils.solidityKeccak256(
      types,
      values
    )

    metaTransaction.signature = await this.rawSignHash(metaTransactionHash)

    return metaTransactionHash
  }

  public async getTxInfos(userAddress: string): Promise<TxInfos> {
    return this.provider.getMetaTxInfos(userAddress)
  }

  /**
   * Takes a string hash and signs it using the loaded wallet without appending `\x19Ethereum Signed Message:\n` to it
   * and hashing it again, contrary to what ethers.sign or ethers.signMessage does.
   * @param hash The hash to sign.
   */
  private async rawSignHash(hash: string): Promise<string> {
    // We expect the hash to be 256 bits represented as a hex string prefixed with "0x"
    const expectedHashLength = (256 / 8) * 2 + 2
    if (hash.length !== expectedHashLength) {
      throw new Error(
        `The input hash given is not a hash hex string prefixed with "0x": ${hash}`
      )
    }

    // This is a trick to use ethers to sign the hash without appending `\x19Ethereum Signed Message:\n`
    const signingKey = new ethersUtils.SigningKey(this.wallet.privateKey)
    const signature = ethersUtils.joinSignature(
      await signingKey.signDigest(hash)
    )
    return signature
  }

  private serializeWallet(
    encryptedKeystore: string,
    identityAddress: string
  ): string {
    const deserializedWallet: IdentityWalletSchema = {
      TLWalletVersion: TL_WALLET_VERSION,
      ethersKeystore: encryptedKeystore,
      identityAddress,
      walletType: WALLET_TYPE_IDENTITY
    }

    const serializedWallet: string = JSON.stringify(deserializedWallet)

    return serializedWallet
  }

  private verifyDeserializedWalletHandled(
    deserializedWallet: IdentityWalletSchema
  ): void {
    const onlyHandledVersion = 1

    if (deserializedWallet.walletType !== WALLET_TYPE_IDENTITY) {
      throw new Error(
        `The serialized wallet given is of a wrong wallet type: ${
          deserializedWallet.walletType
        }, expected: ${WALLET_TYPE_IDENTITY}`
      )
    }

    if (!('TLWalletVersion' in deserializedWallet)) {
      throw new Error(`serialized wallet has no version number.`)
    } else if (deserializedWallet.TLWalletVersion !== onlyHandledVersion) {
      throw new Error(
        `serialized wallet version for wallet is not handled: version ${
          deserializedWallet.TLWalletVersion
        }, expected: ${onlyHandledVersion}`
      )
    }
  }

  private verifyFromField(rawTx: RawTxObject) {
    if (!(rawTx.from === this.address)) {
      throw new Error(
        `The from field of the meta-transaction has to match with the address of the identity, from: ${
          rawTx.from
        }`
      )
    }
  }

  private buildMetaTransaction(rawTx: RawTxObject): MetaTransaction {
    const metaTransaction: MetaTransaction = {
      data: rawTx.data || '0x',
      extraData: '0x',
      from: rawTx.from,
      nonce: rawTx.nonce.toString(),
      to: rawTx.to,
      value: rawTx.value.toString(),
      delegationFees: (rawTx.delegationFees || 0).toString(),
      currencyNetworkOfFees: rawTx.currencyNetworkOfFees || rawTx.to
    }

    return metaTransaction
  }
}

export function calculateIdentityAddress(
  factoryAddress: string,
  ownerAddress: string
) {
  if (!isValidAddress(factoryAddress)) {
    throw new Error(`Invalid factory address: ${factoryAddress}`)
  }
  if (!isValidAddress(ownerAddress)) {
    throw new Error(`Invalid owner address: ${ownerAddress}`)
  }

  const initCode = initcodeWithPadding + ownerAddress.slice(2)
  const initCodeHash = ethers.utils.solidityKeccak256(['bytes'], [initCode])
  // address = keccak256( 0xff ++ address ++ salt ++ keccak256(init_code))[12:]
  const address =
    '0x' +
    ethers.utils
      .solidityKeccak256(
        ['bytes1', 'address', 'uint', 'bytes32'],
        ['0xff', factoryAddress, 0, initCodeHash]
      )
      .slice(2 + 2 * 12)
  return address
}
