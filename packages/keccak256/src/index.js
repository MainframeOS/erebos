// @flow

import createHex, { type hexValue } from '@erebos/hex'
import sha3 from 'js-sha3'

export const hash = (value: Array<number> | Buffer): Array<number> => {
  return sha3.keccak256.array(value)
}

export const pubKeyToAddress = (
  pubKey: hexValue | Array<number> | Buffer,
): hexValue => {
  const value = Array.isArray(pubKey) ? pubKey : createHex(pubKey).toBuffer()
  const address = Buffer.from(hash(value).slice(-20))
  return createHex(address).value
}
