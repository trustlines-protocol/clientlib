import * as msgPack from '@msgpack/msgpack'

export const MSG_PACK_ID = '0x544c4d50' // hex encoded "TLMP" (Trustlines Message Pack)

export interface ExtraData {
  paymentRequestId?: string
  transferId?: string
  remainingData?: string
}

interface ExtraDataEncoding {
  prId?: ArrayBufferView
  trId?: ArrayBufferView
  rest?: ArrayBufferView
}

export function encode(extraData: ExtraData): string {
  const { paymentRequestId, transferId, remainingData } = extraData
  if (!paymentRequestId && !transferId && !remainingData) {
    return '0x'
  } else {
    const data: ExtraDataEncoding = {}
    if (paymentRequestId) {
      data.prId = hexToArray(paymentRequestId)
    }
    if (transferId) {
      data.trId = hexToArray(transferId)
    }
    if (remainingData) {
      data.rest = hexToArray(remainingData)
    }
    const enc = msgPack.encode(data)
    return MSG_PACK_ID + remove0xPrefix(arrayToHex(enc))
  }
}

export function decode(encodedExtraData: string): ExtraData {
  if (!encodedExtraData.startsWith(MSG_PACK_ID)) {
    return null
  }

  const encodedExtraDataArray = hexToArray(
    encodedExtraData.slice(MSG_PACK_ID.length)
  )

  let extraData: ExtraDataEncoding
  try {
    extraData = msgPack.decode(encodedExtraDataArray)
  } catch (error) {
    if (error instanceof RangeError) {
      // The encodedExtraData starts with MSG_PACK_ID but does not follow the expected format
      return null
    } else {
      throw error
    }
  }

  return {
    paymentRequestId: arrayToHex(extraData.prId),
    transferId: arrayToHex(extraData.trId),
    remainingData: arrayToHex(extraData.rest)
  }
}

function remove0xPrefix(hexString) {
  if (hexString.startsWith('0x')) {
    return hexString.slice(2)
  } else {
    return hexString
  }
}

function arrayToHex(a): string {
  // This requires Buffer, which might not be available on certain platforms.
  // If this becomes a problem, we should change the impl here.
  return a ? '0x' + Buffer.from(a).toString('hex') : null
}

function hexToArray(h: string) {
  return Buffer.from(remove0xPrefix(h), 'hex')
}

/**
 * Processes the content of extraData and attaches the content to the object.
 * @param object An object potentially having extra data to process
 */
export function processExtraData(object) {
  if (object.extraData !== undefined) {
    const decodedExtraData = decode(object.extraData)
    object.remainingData = decodedExtraData
      ? decodedExtraData.remainingData || null
      : null
    object.paymentRequestId = decodedExtraData
      ? decodedExtraData.paymentRequestId || null
      : null
    object.transferId = decodedExtraData
      ? decodedExtraData.transferId || null
      : null
  }
  return object
}
