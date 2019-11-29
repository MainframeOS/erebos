import { createHex, hexInput, hexValue, toHexValue } from '@erebos/hex'
import { hash } from '@erebos/keccak256'

import { FeedMetadata, FeedTopicParams, FeedParams } from './types'

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

export const FEED_ZERO_TOPIC: hexValue = '0x0000000000000000000000000000000000000000000000000000000000000000' as hexValue

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

export function feedParamsToReference(params: FeedParams): hexValue {
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
  return toHexValue(hash(payload))
}

export function feedChunkToData(chunkData: ArrayBuffer): ArrayBuffer {
  if (chunkData.byteLength <= FEED_PARAMS_LENGTH + FEED_SIGNATURE_LENGTH) {
    throw new Error('Invalid chunk data length')
  }

  const length =
    chunkData.byteLength - FEED_PARAMS_LENGTH - FEED_SIGNATURE_LENGTH
  return chunkData.slice(FEED_PARAMS_LENGTH, FEED_PARAMS_LENGTH + length)
}

export function feedParamsToMetadata(params: FeedParams): FeedMetadata {
  return {
    feed: {
      user: toHexValue(params.user),
      topic: params.topic != null ? toHexValue(params.topic) : FEED_ZERO_TOPIC,
    },
    epoch: {
      time: params.time != null ? params.time : 0,
      level: params.level != null ? params.level : 0,
    },
    protocolVersion: 0,
  }
}
