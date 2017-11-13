// @flow

// $FlowFixMe
import { Buffer } from 'buffer'

export type base64 = string
export type byteArray = Array<number>
export type hex = string

const hexToBuffer = (hex: hex) => Buffer.from(hex.substr(2), 'hex')

export const encodeHex = (
  input: string | byteArray,
  from: string = 'utf8',
): hex => '0x' + Buffer.from(input, from).toString('hex')

export const decodeHex = (hex: hex, to: string = 'utf8'): string =>
  hexToBuffer(hex).toString(to)

export const base64ToArray = (str: base64): byteArray =>
  Array.from(Buffer.from(str, 'base64'))

export const base64ToHex = (str: base64) => encodeHex(str, 'base64')

export const hexToBase64 = (hex: hex): base64 => decodeHex(hex, 'base64')

export const hexToArray = (hex: string): byteArray =>
  Array.from(hexToBuffer(hex))

export const encodeMessage = (msg: string) => Array.from(Buffer.from(msg))

export const decodeMessage = (msg: base64) =>
  Buffer.from(msg, 'base64').toString()
