// @flow

export opaque type hexValue: string = string

export type hexInput = hexValue | string | Object | Buffer | Array<number>

export const hexValueType = (input: any): hexValue => (input: hexValue)

export const isHexValue = (value: any): boolean => {
  return typeof value === 'string' && value.slice(0, 2) === '0x'
}

export const fromHexValue = (input: hexValue): Buffer => {
  return Buffer.from(input.substr(2), 'hex')
}

const toHexValue = (value: Buffer | string | Iterable<number>): hexValue => {
  return hexValueType('0x' + Buffer.from(value).toString('hex'))
}

type HexInput =
  | {| type: 'buffer', value: Buffer |}
  | {| type: 'bytesArray', value: Array<number> |}
  | {| type: 'hex', value: hexValue |}
  | {| type: 'object', value: Object |}
  | {| type: 'string', value: string |}

export class Hex {
  _input: HexInput
  _value: hexValue

  constructor(inputValue: hexInput | Hex) {
    if (inputValue instanceof Hex) {
      return inputValue
    }

    if (isHexValue(inputValue)) {
      const value = hexValueType(inputValue)
      this._input = { type: 'hex', value }
      this._value = value
    } else {
      if (typeof inputValue === 'string') {
        this._input = { type: 'string', value: inputValue }
        this._value = toHexValue(inputValue)
      } else if (Array.isArray(inputValue)) {
        this._input = { type: 'bytesArray', value: inputValue }
        this._value = toHexValue(inputValue)
      } else if (Buffer.isBuffer(inputValue)) {
        this._input = { type: 'buffer', value: inputValue }
        this._value = toHexValue(inputValue)
      } else if (typeof inputValue === 'object') {
        this._input = { type: 'object', value: inputValue }
        this._value = toHexValue(JSON.stringify(inputValue))
      } else {
        throw new Error('Invalid input')
      }
    }
  }

  get value(): hexValue {
    return this._value
  }

  equals(other: hexInput | Hex): boolean {
    return new Hex(other).value === this._value
  }

  toBuffer(): Buffer {
    switch (this._input.type) {
      case 'buffer':
        return this._input.value
      case 'bytesArray':
      case 'string':
        return Buffer.from(this._input.value)
      case 'hex':
        return fromHexValue(this._input.value)
      case 'object':
        return Buffer.from(JSON.stringify(this._input.value))
      default:
        return Buffer.alloc(0)
    }
  }

  toBytesArray(): Array<number> {
    return this._input.type === 'bytesArray'
      ? this._input.value
      : Array.from(this.toBuffer())
  }

  toObject(): Object {
    return this._input.type === 'object'
      ? this._input.value
      : JSON.parse(this.toString())
  }

  toString(): string {
    switch (this._input.type) {
      case 'buffer':
        return this._input.value.toString()
      case 'bytesArray':
        return Buffer.from(this._input.value).toString()
      case 'hex':
        return fromHexValue(this._input.value).toString()
      case 'object':
        return JSON.stringify(this._input.value)
      case 'string':
        return this._input.value
      default:
        return ''
    }
  }
}

export default (input: hexInput | Hex): Hex => new Hex(input)
