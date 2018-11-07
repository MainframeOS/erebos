// @flow

export opaque type hexValue: string = string

export type hexInput = Buffer | hexValue | Object | string

export const hexValueType = (input: any): hexValue => (input: hexValue)

export const isHexValue = (value: any): boolean => {
  return typeof value === 'string' && value.slice(0, 2) === '0x'
}

export const fromHexValue = (input: hexValue): Buffer => {
  return Buffer.from(input.substr(2), 'hex')
}

type HexInput =
  | {| type: 'buffer', value: Buffer |}
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
        this._value = hexValueType(
          '0x' + Buffer.from(inputValue).toString('hex'),
        )
      } else if (Buffer.isBuffer(inputValue)) {
        this._input = { type: 'buffer', value: inputValue }
        this._value = hexValueType('0x' + inputValue.toString('hex'))
      } else if (typeof inputValue === 'object') {
        this._input = { type: 'object', value: inputValue }
        this._value = hexValueType(
          '0x' + Buffer.from(JSON.stringify(inputValue)).toString('hex'),
        )
      } else {
        throw new Error('Invalid input')
      }
    }
  }

  get value(): hexValue {
    return this._value
  }

  toBuffer(): Buffer {
    switch (this._input.type) {
      case 'buffer':
        return this._input.value
      case 'hex':
        return fromHexValue(this._input.value)
      case 'object':
        return Buffer.from(JSON.stringify(this._input.value))
      case 'string':
        return Buffer.from(this._input.value)
      default:
        return Buffer.alloc(0)
    }
  }

  toObject(): Object {
    switch (this._input.type) {
      case 'buffer':
        return JSON.parse(this._input.value.toString())
      case 'hex':
        return JSON.parse(fromHexValue(this._input.value).toString())
      case 'object':
        return this._input.value
      case 'string':
        return JSON.parse(this._input.value)
      default:
        return {}
    }
  }

  toString(): string {
    switch (this._input.type) {
      case 'buffer':
        return this._input.value.toString()
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
