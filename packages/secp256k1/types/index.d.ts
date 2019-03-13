/// <reference types="node" />

import BN = require('bn.js')
import elliptic = require('elliptic')

export interface SignatureBuffer {
  r: Buffer
  s: Buffer
}

export interface SignatureHex {
  r: string
  s: string
}

export type Signature = SignatureBuffer | SignatureHex

export function createKeyPair(privKey?: string): elliptic.ec.KeyPair

export function createPublic(pubKey: string): elliptic.ec.KeyPair

export function sign(
  bytes: Array<number>,
  privKey: Buffer | BN | string,
): Array<number>

export function verify(
  bytes: Array<number>,
  signature: Array<number> | Signature,
  pubKey: string | elliptic.ec.KeyPair,
): boolean
