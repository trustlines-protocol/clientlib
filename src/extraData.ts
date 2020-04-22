import * as msgPack from '@msgpack/msgpack'

export const MSG_PACK_ID = '0x544c4d50' // hex encoded "TLMP" (Trustlines Message Pack)

export interface ExtraData {
  paymentRequestId?: string
}

interface ExtraDataEncoding {
  prId?: ArrayBufferView
}

export function encode(extraData: ExtraData): string {
  const { paymentRequestId } = extraData
  if (!paymentRequestId) {
    return '0x'
  } else {
    const data: ExtraDataEncoding = {}
    if (paymentRequestId) {
      data.prId = hexToArray(paymentRequestId)
    }
    const enc = msgPack.encode(data)
    return MSG_PACK_ID + remove0xPrefix(arrayToHex(enc))
  }
}

export function decode(encodedExtraData: string): ExtraData {
  if (encodedExtraData.startsWith(MSG_PACK_ID)) {
    const extraData: ExtraDataEncoding = msgPack.decode(
      hexToArray(encodedExtraData.slice(MSG_PACK_ID.length))
    )
    return { paymentRequestId: arrayToHex(extraData.prId) }
  } else {
    return null
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
  return '0x' + Buffer.from(a).toString('hex')
}

function hexToArray(h: string) {
  return Buffer.from(remove0xPrefix(h), 'hex')
}
