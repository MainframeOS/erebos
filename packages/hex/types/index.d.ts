/// <reference types="node" />

declare enum HexValue {}

export type hexValue = HexValue & string

export type hexInput = hexValue | string | Object | Buffer | Array<number>

export function isHexValue(input: any): boolean

export function fromHexValue(input: hexValue): Buffer

type HexInput =
  | { type: 'buffer'; value: Buffer }
  | { type: 'bytesArray'; value: Array<number> }
  | { type: 'hex'; value: hexValue }
  | { type: 'object'; value: Object }
  | { type: 'string'; value: string }

export class Hex {
  constructor(input: hexInput | Hex)
  value: hexValue
  equals(other: hexInput | Hex): boolean
  toBuffer(): Buffer
  toBytesArray(): Array<number>
  toObject(): Object
  toString(): string
}

export default function(input: hexInput | Hex): Hex
