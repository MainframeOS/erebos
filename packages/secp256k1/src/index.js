// @flow

import elliptic from 'elliptic'
import type EllipticKeyPair from 'elliptic/lib/elliptic/ec/key'

export type KeyPair = EllipticKeyPair
export type Point = Object // Not exported by elliptic

const ec = new elliptic.ec('secp256k1')

export const createKeyPair = (privKey?: ?string): KeyPair => {
  return privKey ? ec.keyFromPrivate(privKey, 'hex') : ec.genKeyPair()
}

export const createPublic = (pubKey: string): Point => {
  return ec.keyFromPublic(pubKey, 'hex').getPublic()
}

export const sign = (bytes: Array<number>, privKey: Object): Array<number> => {
  const sig = ec.sign(bytes, privKey, { canonical: true })
  return [
    ...sig.r.toArray('be', 32),
    ...sig.s.toArray('be', 32),
    sig.recoveryParam,
  ]
}
