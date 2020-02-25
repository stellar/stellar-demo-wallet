import argon2 from '@tinyanvil/argon2'

export function stretchPincode(
  pass: string,
  salt: string
) {
  return argon2.hash({
    pass,
    salt,
    time: 3,
    mem: 20 * 1024,
    hashLen: 32,
    parallelism: 1
  }).then(({hash}) => hash)
}