import { BigNumber } from 'bignumber.js'

import { CurrencyNetwork } from './CurrencyNetwork'
import { Event } from './Event'
import { encode as encodeExtraData, processExtraData } from './extraData'
import { TLProvider } from './providers/TLProvider'
import {
  GAS_LIMIT_IDENTITY_OVERHEAD,
  GAS_LIMIT_MULTIPLIER,
  Transaction
} from './Transaction'
import { User } from './User'

import utils, { defaultBaseUrl } from './utils'

import {
  DecimalsOptions,
  EventFilterOptions,
  FeePayer,
  isFeePayerValue,
  NetworkTransferEvent,
  PathObject,
  PathRaw,
  PaymentOptions,
  PaymentTxObject,
  RawTxObject,
  TransferDetails,
  TransferDetailsRaw,
  TransferIdentifier,
  TxObject
} from './typings'

import { Messaging } from './Messaging'

// Values taken from the contracts repository gas tests
const TRANSFER_BASE_GAS_LIMIT = new BigNumber(61_000)
  .plus(GAS_LIMIT_IDENTITY_OVERHEAD)
  .multipliedBy(GAS_LIMIT_MULTIPLIER)
  .integerValue(BigNumber.ROUND_DOWN)
const TRANSFER_GAS_LIMIT_OVERHEAD_PER_MEDIATOR = new BigNumber(34_000)
  .multipliedBy(GAS_LIMIT_MULTIPLIER)
  .integerValue(BigNumber.ROUND_DOWN)

/**
 * The Payment class contains all payment related functions. This includes trustline transfers and TLC transfers.
 * It is meant to be called via a [[TLNetwork]] instance like:
 * ```typescript
 * const tlNetwork = new TLNetwork(
 *  //...
 * )
 *
 * // Get transfer logs
 * tlNetwork.payment.get(
 *  // ...
 * ).then(
 *  payments => console.log("Payments of loaded user:", payments)
 * )
 * ```
 */
export class Payment {
  private currencyNetwork: CurrencyNetwork
  private event: Event
  private provider: TLProvider
  private transaction: Transaction
  private user: User
  private messaging: Messaging

  /** @hidden */
  constructor(params: {
    event: Event
    user: User
    transaction: Transaction
    currencyNetwork: CurrencyNetwork
    provider: TLProvider
    messaging: Messaging
  }) {
    this.event = params.event
    this.user = params.user
    this.transaction = params.transaction
    this.currencyNetwork = params.currencyNetwork
    this.provider = params.provider
    this.messaging = params.messaging
  }

  /**
   * Prepares ethereum transaction object for a trustlines transfer, where loaded user is sender.
   * @param networkAddress Address of a currency network.
   * @param receiverAddress Address of receiver of transfer.
   * @param value Amount to transfer in biggest unit,
   *              i.e. 1.5 if currency network has 2 decimals.
   * @param options Optional payment options. See [[PaymentOptions]] for more information.
   * @param options.networkDecimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user is willing to pay.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   * @param options.feePayer Either `sender` or `receiver`. Specifies who pays network fees.
   * @param options.extraData Extra data that will appear in the Transfer event when successful
   *                          incompatible with paymentRequestId, addTransferId, and remainingData.
   * @param options.paymentRequestId Payment request identifier that gets encoded to the extra data.
   * @param options.addTransferId Whether a transfer id should be added to the payment, default to true.
   * @param options.remainingData Additional data that will be encoded in the payment extraData.
   */
  public async prepare(
    networkAddress: string,
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = { addTransferId: true }
  ): Promise<PaymentTxObject> {
    const {
      gasPrice,
      gasLimit,
      networkDecimals,
      extraData,
      paymentRequestId,
      addTransferId,
      remainingData
    } = options
    const decimals = await this.currencyNetwork.getDecimals(networkAddress, {
      networkDecimals
    })
    let transferId: string
    if (addTransferId) {
      // 19 decimals fit in 64 bits
      transferId = utils.convertToHexString(utils.generateRandomNumber(19))
    }
    const encodedExtraData: string = encode({
      extraData,
      paymentRequestId,
      transferId,
      remainingData
    })

    const { path, maxFees, feePayer } = await this.getTransferPathInfo(
      networkAddress,
      await this.user.getAddress(),
      receiverAddress,
      value,
      {
        ...options,
        extraData: encodedExtraData,
        networkDecimals: decimals.networkDecimals
      }
    )
    if (path.length > 0) {
      const {
        rawTx,
        txFees
      } = await this.transaction.prepareContractTransaction(
        await this.user.getAddress(),
        networkAddress,
        'CurrencyNetworkV2',
        // if no options are set for feePayer, the sender pays the fees.
        feePayer === FeePayer.Receiver ? 'transferReceiverPays' : 'transfer',
        [
          utils.convertToHexString(
            utils.calcRaw(value, decimals.networkDecimals)
          ),
          utils.convertToHexString(new BigNumber(maxFees.raw)),
          path,
          encodedExtraData
        ],
        {
          gasLimit: gasLimit
            ? new BigNumber(gasLimit)
            : this.calculateTransferGasLimit(path.length),
          gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
        }
      )
      return {
        txFees,
        feePayer,
        maxFees,
        path,
        receiverAddress,
        rawTx,
        transferId: transferId || null
      }
    } else {
      throw new Error('Could not find a path with enough capacity.')
    }
  }

  /**
   * Prepares a ethereum transaction object for a ETH transfer, where loaded user is the sender.
   * @param receiverAddress Address of receiver of transfer.
   * @param value Amount of ETH to transfer.
   * @param options Payment options. See [[PaymentOptions]] for more information.
   * @param options.gasPrice Custom gas price.
   * @param options.gasLimit Custom gas limit.
   */
  public async prepareEth(
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<TxObject> {
    const { gasLimit, gasPrice } = options
    const { txFees, rawTx } = await this.transaction.prepareValueTransaction(
      await this.user.getAddress(),
      receiverAddress,
      utils.calcRaw(value, 18),
      {
        gasLimit: gasLimit ? new BigNumber(gasLimit) : undefined,
        gasPrice: gasPrice ? new BigNumber(gasPrice) : undefined
      }
    )
    return {
      txFees,
      rawTx
    }
  }

  /**
   * Returns a path for a trustlines transfer, along with estimated fees and gas costs.
   * @param networkAddress Address of a currency network.
   * @param senderAddress Address of sender of transfer.
   * @param receiverAddress Address of receiver of transfer.
   * @param value Amount to transfer in biggest unit,
   *              i.e. 1.23 if currency network has 2 decimals.
   * @param options Payment options. See [[PaymentOptions]] for more information.
   * @param options.feePayer Either `sender` or `receiver`. Specifies who pays network fees.
   * @param options.networkDecimals Decimals of currency network can be provided manually.
   * @param options.maximumHops Max. number of hops for transfer.
   * @param options.maximumFees Max. transfer fees user if willing to pay.
   * @param options.extraData Extra data as used for logging purposes in the transfer. Used for estimating gas costs.
   */
  public async getTransferPathInfo(
    networkAddress: string,
    senderAddress: string,
    receiverAddress: string,
    value: number | string,
    options: PaymentOptions = {}
  ): Promise<PathObject> {
    const {
      networkDecimals,
      maximumHops,
      maximumFees,
      feePayer: feePayerOption,
      extraData
    } = options
    const decimals = await this.currencyNetwork.getDecimals(networkAddress, {
      networkDecimals
    })
    const data = {
      feePayer: feePayerOption,
      from: senderAddress,
      maxFees: maximumFees,
      maxHops: maximumHops,
      to: receiverAddress,
      value: utils.calcRaw(value, decimals.networkDecimals).toString(),
      extraData
    }
    const endpoint = `networks/${networkAddress}/path-info`
    const { fees, path, feePayer } = await this.provider.postToEndpoint<
      PathRaw
    >(endpoint, data)

    if (!isFeePayerValue(feePayer)) {
      throw Error(`Unexpected feePayer value: ${feePayer}`)
    }

    return {
      feePayer: feePayer as FeePayer,
      maxFees: utils.formatToAmount(fees, decimals.networkDecimals),
      path
    }
  }

  /**
   * Returns transfer event logs of loaded user in a specified currency network.
   * @param networkAddress Address of currency network.
   * @param filter Event filter object. See [[EventFilterOptions]] for more information.
   */
  public async get(
    networkAddress: string,
    filter: EventFilterOptions = {}
  ): Promise<NetworkTransferEvent[]> {
    return this.event.get<NetworkTransferEvent>(networkAddress, {
      ...filter,
      type: 'Transfer'
    })
  }

  /**
   * Signs a raw transaction object as returned by `prepare`
   * and sends the signed transaction.
   * @param rawTx Raw transaction object.
   * @deprecated use confirmPayment instead.
   */
  public async confirm(rawTx: RawTxObject): Promise<any> {
    return this.transaction.confirm(rawTx)
  }

  /**
   * Signs the rawTx provided as returned by `prepare`
   * and sends the signed transaction as well as the message with transferId
   * Can be directly given a `PaymentTxObject` object as returned by `prepare`
   * @param rawTx Raw transaction object.
   * @param receiverAddress Address of the receiver of the message for the payment.
   * @param transferId The transfer id returned when preparing a payment with message.
   * @param message The message to be sent.
   */
  public async confirmPayment(
    {
      rawTx,
      receiverAddress,
      transferId
    }: { rawTx: RawTxObject; receiverAddress: string; transferId?: string },
    message?: string
  ) {
    if (message) {
      if (!transferId) {
        throw new Error(
          'Cannot use `message` if payment was prepared without `transferId`.'
        )
      }
      await this.messaging.paymentMessage(receiverAddress, transferId, message)
    }
    return this.transaction.confirm(rawTx)
  }

  /**
   * Creates a payment request link.
   * @param networkAddress Address of a currency network.
   * @param options
   *        options.amount - optional amount for the payment request in "normal" units (if we request 1€ - the amount should be 1)
   *        options.customBase - optional customBase for the link
   *        options[key] - any other additional options that should be added to the URL
   */
  public async createRequest(
    networkAddress: string,
    options?: { [key: string]: string; amount?: string; customBase?: string }
  ): Promise<string> {
    const { amount = null, customBase = defaultBaseUrl, ...rest } =
      options || {}
    const path = [
      'paymentrequest',
      networkAddress,
      await this.user.getAddress()
    ]

    if (amount) {
      path.push(amount)
    }

    return utils.buildUrl(customBase, { path, query: rest })
  }

  /**
   * Retrieve the maximum spendable amount and path to user in a network
   *
   * @param networkAddress
   * @param receiverAddress
   *
   * @return {Promise<{path: any, amount: Amount}>}
   */
  public async getMaxAmountAndPathInNetwork(
    networkAddress: string,
    receiverAddress: string
  ): Promise<any> {
    const { networkDecimals } = await this.currencyNetwork.getDecimals(
      networkAddress
    )
    const userAddress = await this.user.getAddress()
    const endpoint = `networks/${networkAddress}/max-capacity-path-info`
    const result = await this.provider.postToEndpoint<{
      capacity: number
      path: string[]
    }>(endpoint, {
      from: userAddress,
      to: receiverAddress
    })

    return {
      amount: utils.formatToAmount(result.capacity, networkDecimals),
      path: result.path
    }
  }

  public calculateTransferGasLimit(pathLength: number): BigNumber {
    const mediators = pathLength - 2
    return TRANSFER_BASE_GAS_LIMIT.plus(
      TRANSFER_GAS_LIMIT_OVERHEAD_PER_MEDIATOR.multipliedBy(mediators)
    )
  }

  /**
   * Get the transfer details list for given transfer identifier
   * @param transferIdentifier Used to identify the transfer for which to get the details.
   * Needs to provide either blockHash and logIndex or txHash
   * Returns a single transfer detail or throw an error if multiple transfer were identified
   * @param transferIdentifier.blockHash Block hash of a transfer event
   * @param transferIdentifier.logIndex Log index of a transfer event
   * @param transferIdentifier.txHash Transaction hash of a transaction responsible for one or more transfers
   * @param options Optional network decimals for formatting the transfer value
   */
  public async getTransferDetails(
    transferIdentifier: TransferIdentifier,
    options: {
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<TransferDetails> {
    const transferDetailsList = await this.getTransferDetailsList(
      transferIdentifier,
      options
    )

    if (transferDetailsList.length > 1) {
      throw new Error(
        `Got multiple transfer information while looking for transfer via transferIdentifier ${transferIdentifier}`
      )
    }
    return transferDetailsList[0]
  }

  /**
   * Get the transfer details list for given transfer identifier
   * @param transferIdentifier Used to identify the transfer for which to get the details.
   * Needs to provide either blockHash and logIndex or txHash
   * @param transferIdentifier.blockHash Block hash of a transfer event
   * @param transferIdentifier.logIndex Log index of a transfer event
   * @param transferIdentifier.txHash Transaction hash of a transaction responsible for one or more transfers
   * @param options Optional network decimals for formatting the transfer value
   */
  public async getTransferDetailsList(
    transferIdentifier: TransferIdentifier,
    options: {
      decimalsOptions?: DecimalsOptions
    } = {}
  ): Promise<TransferDetails[]> {
    this.validateTransferIdentifier(transferIdentifier)

    const baseUrl = utils.buildUrl(`/transfers/`, {
      query: {
        blockHash: transferIdentifier.blockHash,
        logIndex: transferIdentifier.logIndex,
        transactionHash: transferIdentifier.txHash
      }
    })

    const transferDetailsList = await this.provider.fetchEndpoint<
      TransferDetailsRaw[]
    >(baseUrl)
    const DecimalsObjectsList = await Promise.all(
      transferDetailsList.map(async transferInformation =>
        this.currencyNetwork.getDecimals(
          transferInformation.currencyNetwork,
          options.decimalsOptions || {}
        )
      )
    )
    const networkDecimalsList = DecimalsObjectsList.map(
      decimalsObject => decimalsObject.networkDecimals
    )

    return transferDetailsList.map((transferInformation, index) =>
      this.formatTransferDetailsRaw(
        transferInformation,
        networkDecimalsList[index]
      )
    )
  }

  private validateTransferIdentifier(transferIdentifier: TransferIdentifier) {
    if (transferIdentifier.txHash !== undefined) {
      if (
        transferIdentifier.logIndex !== undefined ||
        transferIdentifier.blockHash !== undefined
      ) {
        throw new Error(
          'Cannot get transfer details using txHash, and logIndex and blockHash.'
        )
      }
    } else if (transferIdentifier.logIndex !== undefined) {
      if (transferIdentifier.blockHash === undefined) {
        throw new Error(
          'If logIndex is provided, blockHash needs to be provided to identify the transfer.'
        )
      }
    } else if (transferIdentifier.blockHash !== undefined) {
      throw new Error(
        'If blockHash is provided, logIndex needs to be provided to identify the transfer.'
      )
    } else {
      throw new Error(
        'Either transaction hash or block hash and log index need to be provided.'
      )
    }
  }

  private formatTransferDetailsRaw(
    transferInformation: TransferDetailsRaw,
    networkDecimals: number
  ): TransferDetails {
    const transferDetails = {
      path: transferInformation.path,
      currencyNetwork: transferInformation.currencyNetwork,
      value: utils.formatToAmount(transferInformation.value, networkDecimals),
      feePayer: utils.formatToFeePayer(transferInformation.feePayer),
      totalFees: utils.formatToAmount(
        transferInformation.totalFees,
        networkDecimals
      ),
      feesPaid: transferInformation.feesPaid.map(feesPaidRaw =>
        utils.formatToAmount(feesPaidRaw, networkDecimals)
      ),
      extraData: transferInformation.extraData
    }
    return processExtraData(transferDetails)
  }
}

function encode({
  extraData,
  paymentRequestId,
  transferId,
  remainingData
}: {
  extraData: string
  paymentRequestId: string
  transferId?: string
  remainingData?: string
}) {
  if (extraData && (paymentRequestId || transferId || remainingData)) {
    throw Error(
      'Can not encode extraData and paymentRequestId or transferId or remainingData at the same time'
    )
  }
  if (extraData) {
    return extraData
  } else if (paymentRequestId || transferId || remainingData) {
    return encodeExtraData({ paymentRequestId, transferId, remainingData })
  } else {
    return '0x'
  }
}
