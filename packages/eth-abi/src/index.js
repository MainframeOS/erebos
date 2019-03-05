// @flow

import { Buffer } from 'buffer'
import BN from 'bn.js'

const ADDRESS_SIZE = 20
const BYTE_SIZE = 32
const MAX_UINT = new BN(
  'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
  16,
)
const ONE = new BN(1)
const ZERO = new BN(0)
const NEG_ONE = new BN(-1)

const TYPE_ARRAY = /^(.*)\[([0-9]*)\]$/
const TYPE_BYTES = /^bytes([0-9]*)$/
const TYPE_INTEGER = /^(u?int)([0-9]*)$/

export type ABIFunctionType = 'function' | 'constructor' | 'fallback'

export type ABIFunctionStateMutability =
  | 'pure'
  | 'view'
  | 'nonpayable'
  | 'payable'

export type ABIParameter = {
  type: string,
  name?: string,
  components?: Array<ABIParameter>,
}

export type ABIEventParameter = ABIParameter & {
  indexed?: boolean,
}

export type ABIFunctionDescription = {
  type?: ABIFunctionType, // defaults to 'function' if omitted
  name?: string, // only present when type is 'function'
  inputs?: Array<ABIParameter>, // only present when type is 'function'
  outputs?: Array<ABIParameter>, // can be omitted when not relevant
  stateMutability: ABIFunctionStateMutability,
  constant?: boolean, // defaults to false / deprecated, use stateMutability
  payable?: boolean, // defaults to false / deprecated, use stateMutability
}

export type ABIEventDescription = {
  type: 'event',
  name: string,
  inputs: Array<ABIEventParameter>,
  anonymous?: boolean, // defaults to false
}

export type ABI = Array<ABIFunctionDescription | ABIEventDescription>

export type DecodedParameter<T> = {
  consumed: number,
  value: T,
}

export interface ABICoder<T> {
  decode(data: Buffer): DecodedParameter<T>;
  encode(value: T): Buffer;
}

export const isConstant = (mutability: ABIFunctionStateMutability): boolean => {
  return mutability === 'pure' || mutability === 'view'
}

export const isPayable = (mutability: ABIFunctionStateMutability): boolean => {
  return mutability === 'payable'
}

export class BaseFixedCoder<T> implements ABICoder<T> {
  _byteSize: number = BYTE_SIZE
  get byteSize() {
    return this._byteSize
  }

  decode(_data: Buffer): DecodedParameter<T> {
    throw new Error('Must be implemented')
  }

  encode(_value: T): Buffer {
    throw new Error('Must be implemented')
  }
}

const alignSize = (size: number): number => {
  return BYTE_SIZE * Math.ceil(size / BYTE_SIZE)
}

export class NullCoder extends BaseFixedCoder<null> {
  decode() {
    return {
      consumed: 0,
      value: null,
    }
  }

  encode() {
    return Buffer.alloc(0)
  }
}

export class BaseIntegerCoder<S: number> extends BaseFixedCoder<BN> {
  _size: S // in bytes (0 - 32)
  _bits: number

  constructor(size: S) {
    if (size < 0 || size > BYTE_SIZE) {
      throw new Error('Invalid integer size')
    }
    super()
    this._size = size
    this._bits = size * 8
  }

  get size(): number {
    return this._size
  }

  _decodeNumber(data: Buffer): BN {
    return new BN(data.slice(BYTE_SIZE - this._size))
  }
}

export class SignedIntegerCoder<S: number> extends BaseIntegerCoder<S> {
  _maxValue: BN
  _minValue: BN

  constructor(size: S) {
    super(size)
    this._maxValue = MAX_UINT.maskn(this._bits - 1)
    this._minValue = this._maxValue.add(ONE).mul(NEG_ONE)
  }

  decode(data: Buffer): DecodedParameter<BN> {
    if (data.length !== BYTE_SIZE) {
      throw new Error('Invalid length')
    }
    return {
      consumed: BYTE_SIZE,
      value: this._decodeNumber(data).fromTwos(this._bits),
    }
  }

  encode(value: BN): Buffer {
    if (value.gt(this._maxValue) || value.lt(this._minValue)) {
      throw new Error('Out of bound integer')
    }
    const data = value
      .toTwos(this._bits)
      .maskn(this._bits)
      .fromTwos(this._bits)
      .toTwos(256)
    return data.toArrayLike(Buffer, 'be', BYTE_SIZE)
  }
}

export class UnsignedIntegerCoder<S: number> extends BaseIntegerCoder<S> {
  _maxValue: BN

  constructor(size: S) {
    super(size)
    this._maxValue = MAX_UINT.maskn(this._bits)
  }

  decode(data: Buffer): DecodedParameter<BN> {
    if (data.length !== BYTE_SIZE) {
      throw new Error('Invalid length')
    }
    return {
      consumed: BYTE_SIZE,
      value: this._decodeNumber(data).maskn(this._bits),
    }
  }

  encode(value: BN): Buffer {
    if (value.gt(this._maxValue) || value.lt(ZERO)) {
      throw new Error('Out of bound integer')
    }
    const data = value.toTwos(this._bits).maskn(this._bits)
    return data.toArrayLike(Buffer, 'be', BYTE_SIZE)
  }
}

const uintCoder = new UnsignedIntegerCoder(BYTE_SIZE)

const getDynamicSize = (data: Buffer): number => {
  const lengthBuffer = data.slice(0, BYTE_SIZE)
  return uintCoder.decode(lengthBuffer).value.toNumber()
}

const decodeSlice = <T>(
  coder: ABICoder<T>,
  data: Buffer,
  offset: number,
): DecodedParameter<T> => {
  const slice =
    coder instanceof BaseFixedCoder
      ? data.slice(offset, offset + coder.byteSize)
      : data.slice(offset)
  return coder.decode(slice)
}

const encodeValues = (
  coders: Array<ABICoder<mixed>>,
  values: Array<mixed>,
): Buffer => {
  if (coders.length !== values.length) {
    throw new Error('Invalid array length')
  }
  const encoded = values.map((val, i) => coders[i].encode(val))
  return Buffer.concat(encoded)
}

export class BooleanCoder extends BaseFixedCoder<boolean> {
  decode(data: Buffer): DecodedParameter<boolean> {
    const decoded = uintCoder.decode(data)
    return {
      consumed: decoded.consumed,
      value: !decoded.value.isZero(),
    }
  }

  encode(value: boolean): Buffer {
    return uintCoder.encode(value ? ONE : ZERO)
  }
}

export class AddressCoder extends BaseFixedCoder<Buffer> {
  decode(data: Buffer): DecodedParameter<Buffer> {
    if (data.length !== BYTE_SIZE) {
      throw new Error('Invalid length')
    }
    return {
      consumed: BYTE_SIZE,
      value: data.slice(0, ADDRESS_SIZE),
    }
  }

  encode(value: Buffer): Buffer {
    if (value.length !== ADDRESS_SIZE) {
      throw new Error('Invalid length')
    }
    return Buffer.concat([value], BYTE_SIZE)
  }
}

export class FixedBytesCoder<S: number> extends BaseFixedCoder<Buffer> {
  _size: S // in bytes (0 - 32)

  constructor(size: S) {
    if (size < 0 || size > BYTE_SIZE) {
      throw new Error('Invalid bytes size')
    }
    super()
    this._size = size
  }

  get size(): number {
    return this._size
  }

  decode(data: Buffer): DecodedParameter<Buffer> {
    if (data.length !== BYTE_SIZE) {
      throw new Error('Invalid length')
    }
    return {
      consumed: BYTE_SIZE,
      value: data.slice(0, this._size),
    }
  }

  encode(value: Buffer): Buffer {
    if (value.length !== this._size) {
      throw new Error('Invalid length')
    }
    return Buffer.concat([value], BYTE_SIZE)
  }
}

export class DynamicBytesCoder implements ABICoder<Buffer> {
  decode(data: Buffer): DecodedParameter<Buffer> {
    if (data.length < BYTE_SIZE) {
      throw new Error('Invalid data')
    }
    const dataLength = getDynamicSize(data)
    const dataBuffer = data.slice(BYTE_SIZE, dataLength)
    if (dataBuffer.length < dataLength) {
      throw new Error('Invalid data length')
    }
    return {
      consumed: BYTE_SIZE + dataBuffer.length,
      value: dataBuffer,
    }
  }

  encode(value: Buffer): Buffer {
    return Buffer.concat(
      [uintCoder.encode(value.length), value],
      alignSize(value.length),
    )
  }
}

const bytesCoder = new DynamicBytesCoder()

export class StringCoder implements ABICoder<string> {
  decode(data: Buffer): DecodedParameter<string> {
    const decoded = bytesCoder.decode(data)
    return {
      consumed: decoded.consumed,
      value: decoded.value.toString('utf8'),
    }
  }

  encode(value: string): Buffer {
    return bytesCoder.encode(Buffer.from(value, 'utf8'))
  }
}

export class BaseArrayCoder<T> {
  _itemCoder: ABICoder<T>
  _itemSize: ?number

  constructor(itemCoder: ABICoder<T>) {
    this._itemCoder = itemCoder
    if (itemCoder instanceof BaseFixedCoder) {
      this._itemSize = itemCoder.byteSize
    }
  }

  _decodeItems(
    data: Buffer,
    size: number,
    offset?: number = 0,
  ): DecodedParameter<Array<T>> {
    let consumed = offset
    const items = []
    for (let i = 0; i < size; i++) {
      const decoded = decodeSlice(this._itemCoder, data, consumed)
      consumed += decoded.consumed
      items.push(decoded.value)
    }
    return {
      consumed,
      value: items,
    }
  }

  _encodeItem(value: T): Buffer {
    return this._itemCoder.encode(value)
  }
}

export class FixedArrayCoder<T, S: number> extends BaseArrayCoder<T> {
  _size: S

  constructor(itemCoder: ABICoder<T>, size: S) {
    if (size < 0) {
      throw new Error('Invalid array length')
    }
    super(itemCoder)
    this._size = size
  }

  get size(): number {
    return this._size
  }

  decode(data: Buffer): DecodedParameter<Array<T>> {
    return this._decodeItems(data, this._size)
  }

  encode(value: Array<T>): Buffer {
    if (value.length !== this._size) {
      throw new Error('Invalid array length')
    }
    return Buffer.concat(value.map(this._encodeItem, this))
  }
}

export class DynamicArrayCoder<T> extends BaseArrayCoder<T> {
  decode(data: Buffer): DecodedParameter<Array<T>> {
    return this._decodeItems(data, getDynamicSize(data), BYTE_SIZE)
  }

  encode(value: Array<T>): Buffer {
    const lengthBuffer = uintCoder.encode(value.length)
    const items = value.map(this._encodeItem, this)
    return Buffer.concat([lengthBuffer, ...items])
  }
}

export class TupleCoder<T: Array<mixed>> implements ABICoder<T> {
  _coders: Array<ABICoder<mixed>>

  constructor(coders: Array<ABICoder<mixed>>) {
    this._coders = coders
  }

  get size(): number {
    return this._coders.length
  }

  decode(data: Buffer): DecodedParameter<T> {
    let consumed = 0
    const items = []
    for (const coder of this._coders) {
      const decoded = decodeSlice(coder, data, consumed)
      consumed += decoded.consumed
      items.push(decoded.value)
    }
    return {
      consumed,
      // $FlowFixMe: return type
      value: items,
    }
  }

  encode(value: T): Buffer {
    if (!Array.isArray(value)) {
      throw new Error('Invalid value')
    }
    return encodeValues(this._coders, value)
  }
}

// These coders have already been instantiated, let's provide them in the cache
const cachedCoders: { [name: string]: ABICoder<any> } = {
  bytes: bytesCoder,
  uint256: uintCoder,
}

// These coders classes don't need arguments, they can be lazily created and cached
const basicCoderClasses = {
  '': NullCoder,
  address: AddressCoder,
  bool: BooleanCoder,
  bytes: DynamicBytesCoder,
  string: StringCoder,
}

export const getCoder = (Parameters: ABIParameter): ABICoder<any> => {
  // Check for already cached coders
  const existing = cachedCoders[Parameters.type]
  if (existing != null) {
    return existing
  }

  const toCache = (coder: ABICoder<any>): ABICoder<any> => {
    cachedCoders[Parameters.type] = coder
    return coder
  }

  // Check if Parameters contains components, if so it should be a tuple
  if (
    Parameters.components != null &&
    Parameters.type.substr(0, 5) === 'tuple'
  ) {
    const coders = Parameters.components.map(getCoder)
    return toCache(new TupleCoder(coders))
  }

  // Check and create basic (no argument) coder
  const CoderClass = basicCoderClasses[Parameters.type]
  if (CoderClass != null) {
    return toCache(new CoderClass())
  }

  // Check if integer type
  const intMatch = Parameters.type.match(TYPE_INTEGER)
  if (intMatch != null) {
    const size = parseInt(intMatch[2], 10)
    const coder =
      intMatch[1] === 'int'
        ? new SignedIntegerCoder(size)
        : new UnsignedIntegerCoder(size)
    return toCache(coder)
  }

  // Check if bytes type
  const bytesMatch = Parameters.type.match(TYPE_BYTES)
  if (bytesMatch != null) {
    const size = parseInt(bytesMatch[1], 10)
    return toCache(new FixedBytesCoder(size))
  }

  // Check if array type
  const arrayMatch = Parameters.type.match(TYPE_ARRAY)
  if (arrayMatch != null) {
    const itemCoder = getCoder({ name: '', type: arrayMatch[1] })
    const size = arrayMatch[2] == null ? null : parseInt(arrayMatch[2], 10)
    const coder = size
      ? new FixedArrayCoder(itemCoder, size)
      : new DynamicArrayCoder(itemCoder)
    return toCache(coder)
  }

  throw new Error(`Could not create coder for type ${Parameters.type}`)
}

export class FunctionCoder {
  _inputCoders: Array<ABICoder<any>>
  _outputCoders: Array<ABICoder<any>>

  constructor(
    inputs: Array<ABIParameter> = [],
    outputs: Array<ABIParameter> = [],
  ) {
    this._inputCoders = inputs.map(getCoder)
    this._outputCoders = outputs.map(getCoder)
  }

  decode(data: Buffer): Array<mixed> {
    let consumed = 0
    const items = []
    for (const coder of this._outputCoders) {
      const decoded = decodeSlice(coder, data, consumed)
      consumed += decoded.consumed
      items.push(decoded.value)
    }
    return items
  }

  encode(values: Array<mixed>): Buffer {
    return encodeValues(this._inputCoders, values)
  }
}

export const createParametersDecoder = (Parameters: Array<ABIParameter>) => {
  const coders = Parameters.map(getCoder)
  return (data: Buffer): Array<mixed> => {
    let consumed = 0
    const items = []
    for (const coder of coders) {
      const decoded = decodeSlice(coder, data, consumed)
      consumed += decoded.consumed
      items.push(decoded.value)
    }
    return items
  }
}

export const createParametersEncoder = (Parameters: Array<ABIParameter>) => {
  const coders = Parameters.map(getCoder)
  return (values: Array<mixed>): Buffer => {
    return encodeValues(coders, values)
  }
}

export const createEventDecoder = <T: Object>(
  Parameters: Array<ABIEventParameter>,
) => {
  // $FlowFixMe: Parameters type
  const decode = createParametersDecoder(Parameters)
  return (data: Buffer): T => {
    // $FlowFixMe: returned type
    return decode(data).reduce((acc, value, i) => {
      const Parameter = Parameters[i]
      // $FlowFixMe: why doesn't it pick the name?
      acc[Parameter.name] = value
      return acc
    }, {})
  }
}
