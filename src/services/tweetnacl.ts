import nacl from 'tweetnacl'

export function encrypt(
  message: string,
  nonce: string,
  keyArr: Uint8Array
) {
  const enc = new TextEncoder()

  const messageArr = enc.encode(message)
  const nonceArr = enc.encode(nonce.substr(0, 24))

  const encrypted = nacl.secretbox(messageArr, nonceArr, keyArr)

  if (!encrypted)
    throw 'Pincode decryption failed'

  return btoa(String.fromCharCode.apply(null, encrypted))
}

export function decrypt(
  encrypted: string,
  nonce: string,
  keyArr: Uint8Array
) {
  const enc = new TextEncoder()

  const encryptedArr = new Uint8Array(atob(encrypted).split('').map(c => c.charCodeAt(0)))
  const nonceArr = enc.encode(nonce.substr(0, 24))

  const decrypted = nacl.secretbox.open(
    encryptedArr,
    nonceArr,
    keyArr
  )

  if (!decrypted)
    throw 'Pincode decryption failed'

  return String.fromCharCode.apply(null, decrypted)
}