import { BigNumber } from 'bignumber.js'
import * as ethUtils from 'ethereumjs-util'
import ReconnectingWebSocket from 'reconnecting-websocket'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import { Observable } from 'rxjs/Observable'
import { Observer } from 'rxjs/Observer'
import JsonRPC from 'simple-jsonrpc-js'
import NodeWebSocket from 'ws'

import { Provider } from 'ethers/providers'
import {
  Amount,
  AmountInternal,
  AnyExchangeEvent,
  AnyExchangeEventRaw,
  DelegationFeesInternal,
  DelegationFeesObject,
  ExchangeCancelEventRaw,
  ExchangeFillEventRaw,
  ProviderUrl,
  ReconnectingWSOptions
} from './typings'

if (
  typeof module !== 'undefined' &&
  module.exports &&
  typeof crypto === 'undefined'
) {
  // crypto not available
  console.warn('Random numbers will not be cryptographically secure')
} else {
  BigNumber.config({ CRYPTO: true })
}

/**
 * Returns a `Promise` with a JSON object from given URL.
 * @param url
 * @param options (optional)
 */
export const fetchUrl = async <T>(
  url: string,
  options?: object
): Promise<T> => {
  const response = await fetch(url, options)
  const json = await response.json()
  if (response.status !== 200) {
    throw new Error(
      `Error fetching ${url} | Status ${response.status} | ${json.message}`
    )
  } else {
    return json
  }
}

/**
 * Returns an Observable for a websocket stream.
 * @param url URL to open websocket stream to.
 * @param functionName Name of function to call on opened websocket.
 * @param args Arguments for above function.
 * @param reconnectionOptions Options to specify [reconnecting-websocket](https://github.com/pladaria/reconnecting-websocket#available-options)
 */
export const websocketStream = (
  url: string,
  functionName: string,
  args: object,
  reconnectingOptions: ReconnectingWSOptions = {}
): Observable<any> => {
  return Observable.create((observer: Observer<any>) => {
    const options = {
      WebSocket: (global as any).WebSocket ? undefined : NodeWebSocket,
      minReconnectionDelay: 1,
      reconnectOnError: true,
      ...reconnectingOptions
    }
    const ws = new ReconnectingWebSocket(url, undefined, options)
    const jrpc = new JsonRPC()

    jrpc.toStream = (message: string) => {
      ws.send(message)
    }

    ws.onmessage = (e: MessageEvent) => {
      jrpc.messageHandler(e.data)
    }

    ws.onerror = (e: ErrorEvent) => {
      const error = new Error(e.message)
      if (options.reconnectOnError) {
        // Allows observer to act on web socket errors while trying to reconnect
        observer.next({
          type: 'WebSocketError',
          error,
          retryCount: ws.retryCount
        })
      } else {
        observer.error(error)
      }
    }

    ws.onopen = () => {
      observer.next({ type: 'WebsocketOpen' })
      jrpc.call(functionName, args).then((subscriptionId: string) => {
        jrpc.on(`subscription_${subscriptionId}`, ['event'], event => {
          observer.next(event)
        })
      })
      if (functionName === 'listen') {
        jrpc.call('getMissedMessages', args).then(events => {
          events.map(event => {
            observer.next(event)
          })
        })
      }
    }

    return () => {
      ws.close(1000, '')
    }
  })
}

/**
 * Encodes URI components and returns a URL.
 * @param baseUrl base URL
 * @param params (optional) parameters for queries
 */
export const buildUrl = (baseUrl: string, params?: any[] | object): string => {
  if (Array.isArray(params)) {
    return params.reduce(
      (acc, param, i) =>
        `${acc}${encodeURIComponent(param)}${
          i === params.length - 1 ? '' : '/'
        }`,
      baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
    )
  }
  if (typeof params === 'object') {
    const paramKeys = Object.keys(params)
    return paramKeys
      .filter(key => params[key])
      .reduce(
        (acc, paramKey) =>
          `${acc}${
            acc.indexOf('?') === -1 ? '?' : '&'
          }${paramKey}=${encodeURIComponent(params[paramKey])}`,
        baseUrl.endsWith('/') ? baseUrl.slice(0, baseUrl.length - 1) : baseUrl
      )
  }
  return baseUrl
}

/**
 * Returns a `trustlines://` link.
 * @param params Parameters of link.
 * @param customBase Optional custom base instead of `trustlines://`.
 */
export const createLink = (params: any[], customBase?: string): string => {
  const base = customBase || 'trustlines://'
  return buildUrl(base, params)
}

/**
 * Returns the smallest representation of a number.
 * @param value Representation of number in biggest unit.
 * @param decimals Number of decimals.
 */
export const calcRaw = (
  value: number | string | BigNumber,
  decimals: number
): BigNumber => {
  const factor = new BigNumber(10).exponentiatedBy(decimals)
  return new BigNumber(value).multipliedBy(factor)
}

/**
 * Returns the biggest representation of a number.
 * @param raw Representation of number in smallest unit.
 * @param decimals Number of decimals.
 */
export const calcValue = (
  raw: number | string | BigNumber,
  decimals: number
): BigNumber => {
  const divisor = new BigNumber(10).exponentiatedBy(decimals)
  return new BigNumber(raw).dividedBy(divisor)
}

/**
 * Formats number into an AmountInternal object which is intended for internal use.
 * @param raw Representation of number in smallest unit.
 * @param decimals Number of decimals.
 */
export const formatToAmountInternal = (
  raw: number | string | BigNumber,
  decimals: number
): AmountInternal => {
  return {
    decimals,
    raw: new BigNumber(raw),
    value: calcValue(raw, decimals)
  }
}

/**
 * Converts an AmountInternal to Amount object.
 * @param amount AmountInternal object.
 */
export const convertToAmount = (amount: AmountInternal): Amount => {
  return {
    ...amount,
    raw: amount.raw.toString(),
    value: amount.value.toString()
  }
}

/**
 * Formats raw representation of number into a Amount object.
 * @param raw Representation of number in smallest unit.
 * @param decimals Number of decimals.
 */
export const formatToAmount = (
  raw: number | string | BigNumber,
  decimals: number
): Amount => {
  return {
    decimals,
    raw: new BigNumber(raw).toString(),
    value: calcValue(raw, decimals).toString()
  }
}

/**
 * Formats number into an AmountInternal object which is intended for internal use.
 * @param raw Representation of number in smallest unit.
 * @param decimals Number of decimals.
 * @param currencyNetworkOfFees the currency network corresponding to the delegation fees
 */
export const formatToDelegationFeesInternal = (
  baseFee: number | string | BigNumber,
  decimals: number,
  gasPrice: number | string | BigNumber,
  currencyNetworkOfFees: string
): DelegationFeesInternal => {
  return {
    baseFee: {
      decimals,
      raw: new BigNumber(baseFee),
      value: calcValue(baseFee, decimals)
    },
    gasPrice: {
      decimals,
      raw: new BigNumber(gasPrice),
      value: calcValue(gasPrice, 6)
    },
    currencyNetworkOfFees
  }
}

/**
 * Formats number into an AmountInternal object which is intended for internal use.
 * @param delegationFees DelegationFeesInternal object.
 */
export const convertToDelegationFees = (
  delegationFees: DelegationFeesInternal
): DelegationFeesObject => {
  return {
    baseFee: convertToAmount(delegationFees.baseFee),
    gasPrice: convertToAmount(delegationFees.gasPrice),
    currencyNetworkOfFees: delegationFees.currencyNetworkOfFees
  }
}

/**
 * Formats the number values of a raw event returned by the relay.
 * @param event raw event
 * @param networkDecimals decimals of currency network
 * @param interestRateDecimals interest rate decimals of currency network
 */
export const formatEvent = <T>(
  event: any,
  networkDecimals: number,
  interestRateDecimals: number
): T => {
  // key names whose values are numerics and should get formatted
  const keys = [
    'amount',
    'balance',
    'given',
    'received',
    'leftGiven',
    'leftReceived',
    'interestRateGiven',
    'interestRateReceived'
  ]
  for (const key of keys) {
    if (event[key]) {
      event[key] = formatToAmount(
        event[key],
        key.includes('interestRate') ? interestRateDecimals : networkDecimals
      )
    }
  }
  return event
}

/**
 * Formats the number values of a raw Exchange event as returned by the relay.
 * @param exchangeEvent raw exchange event: `LogFill` or `LogCancel`
 * @param makerDecimals decimals in maker token
 * @param takerDecimals decimals in taker token
 */
export const formatExchangeEvent = (
  exchangeEvent: AnyExchangeEventRaw,
  makerDecimals: number,
  takerDecimals: number
): AnyExchangeEvent => {
  if (exchangeEvent.type === 'LogFill') {
    const fillEventRaw = exchangeEvent as ExchangeFillEventRaw
    return {
      ...fillEventRaw,
      filledMakerAmount: formatToAmount(
        fillEventRaw.filledMakerAmount,
        makerDecimals
      ),
      filledTakerAmount: formatToAmount(
        fillEventRaw.filledTakerAmount,
        takerDecimals
      )
    }
  } else if (exchangeEvent.type === 'LogCancel') {
    const cancelEventRaw = exchangeEvent as ExchangeCancelEventRaw
    return {
      ...cancelEventRaw,
      cancelledMakerAmount: formatToAmount(
        cancelEventRaw.cancelledMakerAmount,
        makerDecimals
      ),
      cancelledTakerAmount: formatToAmount(
        cancelEventRaw.cancelledTakerAmount,
        takerDecimals
      )
    }
  }
  throw new Error('Provided event is not a ExchangeEvent!')
}

/**
 * Checks if given address is a valid address
 * @param address ethereum address
 */
export const checkAddress = (address: string): boolean => {
  if (/[A-Z]/.test(address)) {
    return ethUtils.isValidChecksumAddress(address)
  } else {
    return ethUtils.isValidAddress(address)
  }
}

/**
 * Converts eth to wei
 * @param value value in eth
 */
export const convertEthToWei = (value: number | string): number => {
  const eth = new BigNumber(value)
  const wei = new BigNumber(1000000000000000000)
  return eth.times(wei).toNumber()
}

/**
 * Returns the hexdecimal representation of given decimal string. The value has to be an integer.
 * @param decimalStr Decimal string representation of number.
 */
export const convertToHexString = (
  decimalStr: string | number | BigNumber
): string => {
  const bigNumber = new BigNumber(decimalStr)
  if (!bigNumber.isInteger()) {
    // Non integers values can not be processed by ethereum
    throw new Error('Can not convert non integer: ' + bigNumber.toString())
  }
  const hexStr = bigNumber.toString(16)
  return ethUtils.addHexPrefix(hexStr)
}

/**
 * Generates a random number with specified decimals.
 * @param decimals Decimals which determine size of generated number.
 */
export const generateRandomNumber = (decimals: number): BigNumber => {
  let random = BigNumber.random(decimals + 1)
  const one = new BigNumber(1)

  while (random === one) {
    random = BigNumber.random(decimals + 1)
  }
  return random.multipliedBy(new BigNumber(10).pow(decimals)).integerValue()
}

/**
 * Checks if given string is a valid url.
 * @param str String to check.
 */
export const isURL = str => {
  const pattern = new RegExp(
    '^(https?:\\/\\/)?' + // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|' + // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$',
    'i'
  ) // fragment locator
  return pattern.test(str)
}

/**
 * Returns URL by concatenating protocol, host, port and path from ProviderUrl object.
 * @param UrlObject.protocol relay api endpoint protocol
 * @param UrlObject.host relay api host address
 * @param UrlObject.port relay api port
 * @param UrlObject.path relay api base endpoint
 */
export const buildApiUrl = (UrlObject: ProviderUrl): string => {
  return `${UrlObject.protocol}://${UrlObject.host}${UrlObject.port &&
    `:${UrlObject.port}`}${UrlObject.path && `/${trimUrl(UrlObject.path)}`}`
}

/**
 * Returns URL by concatenating protocol, host, port and path.
 * @param UrlObject.wsProtocol relay ws api endpoint protocol
 * @param UrlObject.host relay api host address
 * @param UrlObject.port relay api port
 * @param UrlObject.path relay api base endpoint
 */
export const buildWsApiUrl = (UrlObject: ProviderUrl): string => {
  return `${UrlObject.protocol === 'https' ? 'wss' : 'ws'}://${
    UrlObject.host
  }${UrlObject.port && `:${UrlObject.port}`}${UrlObject.path &&
    `/${trimUrl(UrlObject.path)}`}`
}

/**
 * Adds a slash to the endpoint if it does not start with it.
 * @param endpoint Endpoint to format.
 */
export const formatEndpoint = (endpoint: string): string => {
  if (endpoint[0] !== '/') {
    return `/${endpoint}`
  }
  return endpoint
}

/**
 * Trims url from slashes.
 * @param url URL to be trimmed from slashes.
 */
export const trimUrl = (url: string): string => {
  return url
    .split('/')
    .filter(split => split)
    .join('/')
}

export default {
  buildApiUrl,
  buildWsApiUrl,
  buildUrl,
  calcRaw,
  calcValue,
  checkAddress,
  convertEthToWei,
  convertToAmount,
  convertToHexString,
  convertToDelegationFees,
  createLink,
  fetchUrl,
  formatEndpoint,
  formatEvent,
  formatExchangeEvent,
  formatToAmount,
  formatToAmountInternal,
  formatToDelegationFeesInternal,
  generateRandomNumber,
  isURL,
  trimUrl,
  websocketStream
}
