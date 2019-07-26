import { createHex, hexValue } from '@erebos/hex'
import sha3 from 'js-sha3'

export function hash(value: Array<number> | Buffer): Array<number> {
  return sha3.keccak256.array(value)
}

export function pubKeyToAddress(
  pubKey: hexValue | Array<number> | Buffer,
): hexValue {
  const key = Array.isArray(pubKey) ? pubKey : createHex(pubKey).toBuffer()
  // If key is 65-byte long, first byte should be removed
  const value = key.length === 65 ? key.slice(1) : key
  // Ethereum address is the last 20 bytes of the hashed public key
  const address = Buffer.from(hash(value).slice(-20))
  return createHex(address).value
}
