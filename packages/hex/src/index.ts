enum HexValue {
  _ = '',
}

export type hexValue = HexValue & string

export type hexInput =
  | hexValue
  | string
  | Record<string, any>
  | Buffer
  | Array<number>

export function isHexValue(value: any): value is hexValue {
  return typeof value === 'string' && value.startsWith('0x')
}

export function fromHexValue(input: hexValue): Buffer {
  return Buffer.from((input as string).substr(2), 'hex')
}

export function toHexValue(
  value: Buffer | string | ArrayBuffer | Array<number> | Uint8Array,
): hexValue {
  if (isHexValue(value)) {
    return value
  }
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value as any)
  return ('0x' + buffer.toString('hex')) as hexValue
}

type HexInput =
  | { type: 'buffer'; value: Buffer }
  | { type: 'bytesArray'; value: Array<number> }
  | { type: 'hex'; value: hexValue }
  | { type: 'object'; value: Record<string, any> }
  | { type: 'string'; value: string }

export class Hex {
  protected input!: HexInput
  protected hexValue!: hexValue

  public constructor(inputValue: hexInput | Hex) {
    if (inputValue instanceof Hex) {
      return inputValue
    }

    if (isHexValue(inputValue)) {
      this.input = { type: 'hex', value: inputValue }
      this.hexValue = inputValue
    } else {
      if (typeof inputValue === 'string') {
        this.input = { type: 'string', value: inputValue }
        this.hexValue = toHexValue(inputValue)
      } else if (Array.isArray(inputValue)) {
        this.input = { type: 'bytesArray', value: inputValue }
        this.hexValue = toHexValue(inputValue)
      } else if (Buffer.isBuffer(inputValue)) {
        this.input = { type: 'buffer', value: inputValue }
        this.hexValue = toHexValue(inputValue)
      } else if (typeof inputValue === 'object') {
        this.input = { type: 'object', value: inputValue }
        this.hexValue = toHexValue(JSON.stringify(inputValue))
      } else {
        throw new Error('Invalid input')
      }
    }
  }

  public get value(): hexValue {
    return this.hexValue
  }

  public equals(other: hexInput | Hex): boolean {
    return new Hex(other).value === this.hexValue
  }

  public toBuffer(): Buffer {
    switch (this.input.type) {
      case 'buffer':
        return this.input.value
      case 'bytesArray':
      case 'string':
        return Buffer.from(this.input.value as any)
      case 'hex':
        return fromHexValue(this.input.value)
      case 'object':
        return Buffer.from(JSON.stringify(this.input.value))
      default:
        return Buffer.alloc(0)
    }
  }

  public toBytesArray(): Array<number> {
    return this.input.type === 'bytesArray'
      ? this.input.value
      : Array.from(this.toBuffer())
  }

  public toObject<T = Record<string, any>>(): T {
    return this.input.type === 'object'
      ? this.input.value
      : JSON.parse(this.toString())
  }

  public toString(): string {
    switch (this.input.type) {
      case 'buffer':
        return this.input.value.toString()
      case 'bytesArray':
        return Buffer.from(this.input.value).toString()
      case 'hex':
        return fromHexValue(this.input.value).toString()
      case 'object':
        return JSON.stringify(this.input.value)
      case 'string':
        return this.input.value
      default:
        return ''
    }
  }
}

export function createHex(input: hexInput | Hex): Hex {
  return new Hex(input)
}
