import { ethers } from 'ethers'

import { Contact } from './Contact'
import { CurrencyNetwork } from './CurrencyNetwork'
import { EthWrapper } from './EthWrapper'
import { Event } from './Event'
import { Exchange } from './Exchange'
import { Messaging } from './Messaging'
import { Payment } from './Payment'
import { Transaction } from './Transaction'
import { Trustline } from './Trustline'
import { User } from './User'

import { RelayProvider } from './providers/RelayProvider'
import { TLProvider } from './providers/TLProvider'

import { Provider } from './providers/Provider'
import { TLSigner } from './signers/TLSigner'
import { Web3Signer } from './signers/Web3Signer'

import { EthersWallet } from './wallets/EthersWallet'
import {
  TLWallet,
  WALLET_TYPE_ETHERS,
  WALLET_TYPE_IDENTITY
} from './wallets/TLWallet'

import utils from './utils'

import { NonceMechanism, ProviderUrl, TLNetworkConfig } from './typings'
import { IdentityWallet } from './wallets/IdentityWallet'

/**
 * The TLNetwork class is the single entry-point into the trustlines-clientlib.
 * It contains all of the library's functionality and all calls to the library should be made through a `TLNetwork` instance.
 */
export class TLNetwork {
  private static getApiUrl(
    apiUrl: string | ProviderUrl,
    defaultUrlParameters: ProviderUrl
  ) {
    return this.buildUrl(apiUrl, defaultUrlParameters, utils.buildApiUrl)
  }

  private static getWsUrl(
    wsUrl: string | ProviderUrl,
    defaultUrlParameters: ProviderUrl
  ) {
    return this.buildUrl(wsUrl, defaultUrlParameters, utils.buildWsApiUrl)
  }

  private static buildUrl(
    url: string | ProviderUrl,
    defaultUrlParameters: ProviderUrl,
    buildUrlFunction
  ) {
    return typeof url === 'string'
      ? url
      : buildUrlFunction({
          protocol: url.protocol || defaultUrlParameters.protocol,
          host: url.host || defaultUrlParameters.host,
          port: url.port || defaultUrlParameters.port,
          path: url.path || defaultUrlParameters.path
        })
  }
  /**
   * User instance containing all user/keystore related methods.
   */
  public user: User
  /**
   * Payment instance containing all methods for creating trustline transfers
   * and TLC transfers.
   */
  public payment: Payment
  /**
   * Trustline instance containing all methods for managing trustlines.
   */
  public trustline: Trustline
  /**
   * CurrencyNetwork instance containing all methods for retrieving currency network
   * related information.
   */
  public currencyNetwork: CurrencyNetwork
  /**
   * Event instance for retrieving and formatting event logs.
   */
  public event: Event
  /**
   * @hidden
   * Transaction instance containing all transaction related methods.
   */
  public transaction: Transaction
  /**
   * @hidden
   */
  public contact: Contact
  /**
   * Exchange instance containing all methods for making and taking orders.
   * @hidden
   */
  public exchange: Exchange
  /**
   * @hidden
   */
  public messaging: Messaging
  /**
   * @hidden
   * EthWrapper instance for wrapping and unwrapping ETH.
   */
  public ethWrapper: EthWrapper
  /**
   * @hidden
   */
  public web3: any
  /**
   * @hidden
   */
  public signer: TLSigner
  /**
   * @hidden
   */
  public wallet: TLWallet
  /**
   * @hidden
   */
  public relayProvider: TLProvider
  /**
   * @hidden
   */
  public messagingProvider: Provider

  /**
   * Initiates a new TLNetwork instance that provides the public interface to trustlines-clientlib.
   * @param config Configuration object. See [[TLNetworkConfig]] for more information.
   */
  constructor(config: TLNetworkConfig = {}) {
    const {
      relayUrl = {},
      messagingUrl = {},
      web3Provider,
      identityFactoryAddress,
      identityImplementationAddress,
      walletType = WALLET_TYPE_ETHERS,
      chainId,
      nonceMechanism = NonceMechanism.Random
    } = config

    const defaultUrlParameters: ProviderUrl = {
      protocol: 'http',
      port: '',
      path: '',
      host: 'localhost'
    }

    this.setProviders(
      new RelayProvider(
        TLNetwork.getApiUrl(relayUrl, defaultUrlParameters),
        TLNetwork.getWsUrl(relayUrl, defaultUrlParameters)
      ),
      new Provider(
        TLNetwork.getApiUrl(messagingUrl, defaultUrlParameters),
        TLNetwork.getWsUrl(messagingUrl, defaultUrlParameters)
      )
    )

    this.setWallet(
      walletType,
      this.relayProvider,
      chainId,
      identityFactoryAddress,
      identityImplementationAddress,
      nonceMechanism
    )
    this.setSigner(web3Provider, this.wallet)

    this.currencyNetwork = new CurrencyNetwork(this.relayProvider)
    this.transaction = new Transaction({
      provider: this.relayProvider,
      signer: this.signer,
      currencyNetwork: this.currencyNetwork
    })
    this.user = new User({
      provider: this.relayProvider,
      signer: this.signer,
      wallet: this.wallet
    })
    this.contact = new Contact({
      provider: this.relayProvider,
      user: this.user
    })
    this.event = new Event({
      currencyNetwork: this.currencyNetwork,
      provider: this.relayProvider,
      user: this.user
    })
    this.messaging = new Messaging({
      currencyNetwork: this.currencyNetwork,
      provider: this.messagingProvider,
      user: this.user
    })
    this.trustline = new Trustline({
      currencyNetwork: this.currencyNetwork,
      event: this.event,
      provider: this.relayProvider,
      transaction: this.transaction,
      user: this.user
    })
    this.payment = new Payment({
      currencyNetwork: this.currencyNetwork,
      event: this.event,
      provider: this.relayProvider,
      transaction: this.transaction,
      user: this.user,
      messaging: this.messaging
    })
    this.exchange = new Exchange({
      currencyNetwork: this.currencyNetwork,
      event: this.event,
      payment: this.payment,
      provider: this.relayProvider,
      transaction: this.transaction,
      user: this.user
    })
    this.ethWrapper = new EthWrapper({
      provider: this.relayProvider,
      transaction: this.transaction,
      user: this.user
    })
  }

  /**
   * @hidden
   */
  public setProviders(
    relayProvider: TLProvider,
    messagingProvider: Provider
  ): void {
    if (!(relayProvider instanceof RelayProvider)) {
      throw new Error('Provider not supported.')
    }
    this.relayProvider = relayProvider
    this.messagingProvider = messagingProvider
  }

  /**
   * @hidden
   */
  public setSigner(web3Provider, wallet: TLWallet): void {
    const signer: TLSigner = web3Provider
      ? new Web3Signer(new ethers.providers.Web3Provider(web3Provider))
      : wallet

    if (
      !(
        signer instanceof Web3Signer ||
        signer instanceof EthersWallet ||
        signer instanceof IdentityWallet
      )
    ) {
      throw new Error('Signer not supported.')
    }
    this.signer = signer
  }

  /**
   * @hidden
   */
  public setWallet(
    walletType: string,
    provider: TLProvider,
    chainId: number,
    identityFactoryAddress: string,
    identityImplementationAddress: string,
    nonceMechanism: NonceMechanism
  ): void {
    let wallet: TLWallet

    if (walletType === WALLET_TYPE_IDENTITY) {
      wallet = new IdentityWallet(
        provider,
        chainId,
        identityFactoryAddress,
        identityImplementationAddress,
        nonceMechanism
      )
    } else if (walletType === WALLET_TYPE_ETHERS) {
      wallet = new EthersWallet(provider)
    } else {
      throw new Error(`Wallet type given is not handled: ${walletType}`)
    }

    this.wallet = wallet
  }
}
