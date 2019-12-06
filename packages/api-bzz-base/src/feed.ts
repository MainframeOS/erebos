import { createHex, hexInput, hexValue, toHexValue } from '@erebos/hex'
import { hash } from '@erebos/keccak256'

import {
  Feed,
  FeedEpoch,
  FeedMetadata,
  FeedTopicParams,
  FeedParams,
} from './types'

const FEED_CHUNK_LENGTH = 4096
const FEED_TOPIC_LENGTH = 32
const FEED_USER_LENGTH = 20
const FEED_TIME_LENGTH = 7
const FEED_LEVEL_LENGTH = 1
const FEED_HEADER_LENGTH = 8

const FEED_PARAMS_LENGTH =
  FEED_TOPIC_LENGTH +
  FEED_USER_LENGTH +
  FEED_TIME_LENGTH +
  FEED_LEVEL_LENGTH +
  FEED_HEADER_LENGTH

const FEED_SIGNATURE_LENGTH = 65

export const FEED_MAX_DATA_LENGTH =
  FEED_CHUNK_LENGTH - FEED_PARAMS_LENGTH - FEED_SIGNATURE_LENGTH

export const FEED_ZERO_TOPIC: hexValue = '0x0000000000000000000000000000000000000000000000000000000000000000' as hexValue

export function isFeedMetadata(input: any): input is FeedMetadata {
  return (
    input.feed != null &&
    typeof input.feed.user === 'string' &&
    typeof input.feed.topic === 'string' &&
    input.epoch != null &&
    typeof input.epoch.time === 'number' &&
    typeof input.epoch.level === 'number' &&
    typeof input.protocolVersion === 'number'
  )
}

export function getFeedChunkData(chunk: ArrayBuffer): ArrayBuffer {
  if (chunk.byteLength <= FEED_PARAMS_LENGTH + FEED_SIGNATURE_LENGTH) {
    throw new Error('Invalid chunk data length')
  }
  return chunk.slice(
    FEED_PARAMS_LENGTH,
    chunk.byteLength - FEED_SIGNATURE_LENGTH,
  )
}

export function getFeedTopic(params: FeedTopicParams): hexValue {
  const topicHex = createHex(params.topic || Buffer.alloc(FEED_TOPIC_LENGTH))
  if (params.name == null) {
    return topicHex.value
  }

  const name = Buffer.from(params.name)
  const topic = topicHex.toBuffer()
  const bytes = Array(FEED_TOPIC_LENGTH)
    .fill(0)
    .map((_, i) => topic[i] ^ name[i])
  return toHexValue(bytes)
}

export function feedParamsToHash(params: FeedParams): string {
  if (params.topic == null) {
    throw new Error('Invalid topic')
  }
  const topicBuffer = createHex(params.topic).toBuffer()
  if (topicBuffer.length !== FEED_TOPIC_LENGTH) {
    throw new Error('Invalid topic length')
  }
  const userBuffer = createHex(params.user).toBuffer()
  if (userBuffer.length !== FEED_USER_LENGTH) {
    throw new Error('Invalid user length')
  }

  if (params.time == null) {
    throw new Error('Invalid time')
  }
  const timeBuffer = Buffer.alloc(FEED_TIME_LENGTH, 0)
  timeBuffer.writeUInt32LE(params.time, 0)
  if (params.level == null) {
    throw new Error('Invalid level')
  }
  const levelBuffer = Buffer.alloc(FEED_LEVEL_LENGTH, 0)
  levelBuffer.writeUInt8(params.level, 0)

  const payload = Buffer.concat([
    topicBuffer,
    userBuffer,
    timeBuffer,
    levelBuffer,
  ])
  return Buffer.from(hash(payload)).toString('hex')
}

export class FeedID implements FeedParams, FeedMetadata {
  public static fromMetadata(meta: FeedMetadata): FeedID {
    const id = new FeedID({
      user: meta.feed.user,
      topic: meta.feed.topic,
      time: meta.epoch.time,
      level: meta.epoch.level,
    })
    id.protocolVersion = meta.protocolVersion
    return id
  }

  public user: hexValue
  public topic: hexValue
  public time: number
  public level: number
  public protocolVersion = 0

  public constructor(params: FeedParams) {
    this.user = params.user as hexValue
    this.topic = getFeedTopic(params)
    this.time = params.time || 0
    this.level = params.level || 0
  }

  public get feed(): Feed {
    return {
      user: this.user,
      topic: this.topic,
    }
  }

  public get epoch(): FeedEpoch {
    return {
      time: this.time,
      level: this.level,
    }
  }

  public clone(): FeedID {
    return new FeedID(this)
  }

  public toHash(): string {
    return feedParamsToHash(this)
  }
}

export function createFeedID(
  input: FeedID | FeedMetadata | FeedParams,
): FeedID {
  if (input instanceof FeedID) {
    return input.clone()
  }
  if (isFeedMetadata(input)) {
    return FeedID.fromMetadata(input)
  }
  return new FeedID(input)
}

export function getFeedMetadata(
  input: FeedID | FeedMetadata | FeedParams,
): FeedMetadata {
  if (input instanceof FeedID) {
    return input
  }
  if (isFeedMetadata(input)) {
    return input
  }
  return new FeedID(input)
}

export function createFeedDigest(
  meta: FeedMetadata,
  data: hexInput,
): Array<number> {
  const topicBuffer = createHex(meta.feed.topic).toBuffer()
  if (topicBuffer.length !== FEED_TOPIC_LENGTH) {
    throw new Error('Invalid topic length')
  }
  const userBuffer = createHex(meta.feed.user).toBuffer()
  if (userBuffer.length !== FEED_USER_LENGTH) {
    throw new Error('Invalid user length')
  }

  const headerBuffer = Buffer.alloc(FEED_HEADER_LENGTH, 0)
  headerBuffer.writeInt8(meta.protocolVersion, 0)
  const timeBuffer = Buffer.alloc(FEED_TIME_LENGTH, 0)
  timeBuffer.writeUInt32LE(meta.epoch.time, 0)
  const levelBuffer = Buffer.alloc(FEED_LEVEL_LENGTH, 0)
  levelBuffer.writeUInt8(meta.epoch.level, 0)

  const payload = Buffer.concat([
    headerBuffer,
    topicBuffer,
    userBuffer,
    timeBuffer,
    levelBuffer,
    createHex(data).toBuffer(),
  ])
  return hash(payload)
}
