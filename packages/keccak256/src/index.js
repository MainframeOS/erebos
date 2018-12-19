// @flow

import { hexValueType, type hexValue } from '@erebos/hex'
import sha3 from 'js-sha3'

export const hash = (value: Array<number> | Buffer): Array<number> => {
  return sha3.keccak256.array(value)
}

export const pubKeyToAddress = (pubKey: Array<number> | Buffer): hexValue => {
  const address = hash(pubKey).slice(-20)
  return hexValueType('0x' + Buffer.from(address).toString('hex'))
}
