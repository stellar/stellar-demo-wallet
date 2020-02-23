import argon2 from '@tinyanvil/argon2'

export function stretchPincode(
  pass: string,
  salt: string
) {
  return argon2.hash({
    pass,
    salt,
    time: 100,
    mem: 1024,
    hashLen: 32,
    type: argon2.ArgonType.Argon2d
  }).then(({hash}) => hash)
}