// @flow

// $FlowFixMe
import { Buffer } from 'buffer'

export type hex = string

const hexToBuffer = (hex: hex) => Buffer.from(hex.substr(2), 'hex')

export const encodeHex = (
  input: string | Array<number>,
  from: string = 'utf8',
): hex => '0x' + Buffer.from(input, from).toString('hex')

export const decodeHex = (hex: hex, to: string = 'utf8'): string =>
  hexToBuffer(hex).toString(to)
