import * as msgPack from '@msgpack/msgpack'

export const MSG_PACK_ID = '0x544c4d50' // hex encoded "TLMP" (Trustlines Message Pack)

export interface ExtraData {
  paymentRequestId?: string
  messageId?: string
}

interface ExtraDataEncoding {
  prId?: ArrayBufferView
  mgId?: ArrayBufferView
}

export function encode(extraData: ExtraData): string {
  const { paymentRequestId, messageId } = extraData
  if (!paymentRequestId && !messageId) {
    return '0x'
  } else {
    const data: ExtraDataEncoding = {}
    if (paymentRequestId) {
      data.prId = hexToArray(paymentRequestId)
    }
    if (messageId) {
      data.mgId = hexToArray(messageId)
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
    messageId: arrayToHex(extraData.mgId)
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
