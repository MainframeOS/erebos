import elliptic from 'elliptic'

export type KeyPair = elliptic.ec.KeyPair
export type Signature = { r: Buffer; s: Buffer } | { r: string; s: string }

export const ec = new elliptic.ec('secp256k1')

export function createKeyPair(privKey?: string): KeyPair {
  return privKey ? ec.keyFromPrivate(privKey, 'hex') : ec.genKeyPair()
}

export function createPublic(pubKey: string): KeyPair {
  return ec.keyFromPublic(pubKey, 'hex')
}

export function sign(
  bytes: Array<number>,
  privKey: KeyPair | Buffer,
): Array<number> {
  const sig = ec.sign(bytes, privKey, { canonical: true })
  return [
    ...sig.r.toArray('be', 32),
    ...sig.s.toArray('be', 32),
    sig.recoveryParam || 0,
  ]
}

export function verify(
  bytes: Array<number>,
  signature: Array<number> | Signature,
  pubKey: string | KeyPair,
): boolean {
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
