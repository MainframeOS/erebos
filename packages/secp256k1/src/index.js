// @flow

import elliptic from 'elliptic'
import type EllipticKeyPair from 'elliptic/lib/elliptic/ec/key'

export type KeyPair = EllipticKeyPair

const ec = new elliptic.ec('secp256k1')

export const createKeyPair = (privKey?: ?string, enc?: 'hex'): KeyPair => {
  return privKey ? ec.keyFromPrivate(privKey, enc) : ec.genKeyPair()
}

export const sign = (bytes: Array<number>, privKey: Object): Array<number> => {
  const sig = ec.sign(bytes, privKey, { canonical: true })
  return [
    ...sig.r.toArray('be', 32),
    ...sig.s.toArray('be', 32),
    sig.recoveryParam,
  ]
}
