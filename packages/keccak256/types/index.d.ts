/// <reference types="node" />

import { hexValue } from '@erebos/hex'

export function hash(value: Array<number> | Buffer): Array<number>
export function pubKeyToAddress(value: Array<number> | Buffer): hexValue
