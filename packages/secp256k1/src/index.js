// @flow

import elliptic from 'elliptic'
import type EllipticKeyPair from 'elliptic/lib/elliptic/ec/key'

export type KeyPair = EllipticKeyPair
export type Signature = { r: Buffer, s: Buffer } | { r: string, s: string }

const ec = new elliptic.ec('secp256k1')

export const createKeyPair = (privKey?: ?string): KeyPair => {
  return privKey ? ec.keyFromPrivate(privKey, 'hex') : ec.genKeyPair()
}

export const createPublic = (pubKey: string): KeyPair => {
  return ec.keyFromPublic(pubKey, 'hex')
}

export const sign = (bytes: Array<number>, privKey: Object): Array<number> => {
  const sig = ec.sign(bytes, privKey, { canonical: true })
  return [
    ...sig.r.toArray('be', 32),
    ...sig.s.toArray('be', 32),
    sig.recoveryParam,
  ]
}

export const verify = (
  bytes: Array<number>,
  signature: Array<number> | Signature,
  pubKey: string | KeyPair,
): boolean => {
  let sig
  if (Array.isArray(signature)) {
    const buf = Buffer.from(signature)
    sig = { r: buf.slice(0, 32), s: buf.slice(32, 64) }
  } else {
    sig = signature
  }
  const key = typeof pubKey === 'string' ? createPublic(pubKey) : pubKey
  return key.verify(bytes, sig)
}
