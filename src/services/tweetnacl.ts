import nacl from 'tweetnacl'
import {
  encode as encodeBase64,
  decode as decodeBase64
} from '@stablelib/base64'
import {
  encode as encodeUtf8,
  decode as decodeUtf8
} from '@stablelib/utf8'

export function encrypt(
  message: string,
  nonce: string,
  keyArr: Uint8Array
) {
  const messageArr = encodeUtf8(message)
  const nonceArr = encodeUtf8(nonce.substr(0, 12) + nonce.substr(nonce.length - 12, nonce.length))

  const encrypted = nacl.secretbox(
    messageArr,
    nonceArr,
    keyArr
  )

  if (!encrypted)
    throw 'Pincode decryption failed'

  return encodeBase64(encrypted)
}

export function decrypt(
  cipher: string,
  nonce: string,
  keyArr: Uint8Array
) {
  const encryptedArr = decodeBase64(cipher)
  const nonceArr = encodeUtf8(nonce.substr(0, 12) + nonce.substr(nonce.length - 12, nonce.length))

  const decrypted = nacl.secretbox.open(
    encryptedArr,
    nonceArr,
    keyArr
  )

  if (!decrypted)
    throw 'Pincode decryption failed'

  return decodeUtf8(decrypted)
}