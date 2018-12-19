/// <reference types="node" />

import BN = require('bn.js')
import elliptic = require('elliptic')

export function createKeyPair(
  privKey?: string,
  enc?: string,
): elliptic.ec.KeyPair

export function sign(
  digest: Array<number>,
  privKey: Buffer | BN | string,
): Array<number>
