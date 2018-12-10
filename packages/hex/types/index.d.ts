/// <reference types="node" />

declare enum HexValue {}

export type hexValue = HexValue & string

export type hexInput = hexValue | string | Object | Buffer

export function isHexValue(input: any): boolean

export function fromHexValue(input: hexValue): Buffer

type HexInput =
  | { type: 'buffer'; value: Buffer }
  | { type: 'hex'; value: hexValue }
  | { type: 'object'; value: Object }
  | { type: 'string'; value: string }

export class Hex {
  constructor(input: hexInput | Hex)
  value: hexValue
  equals(other: hexInput | Hex): boolean
  toBuffer(): Buffer
  toObject(): Object
  toString(): string
}

export default function(input: hexInput | Hex): Hex
