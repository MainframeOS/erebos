import { createHex, hexInput, hexValue, toHexValue } from '@erebos/hex'
import { hash } from '@erebos/keccak256'

import { FeedMetadata, FeedTopicParams } from './types'

const FEED_TOPIC_LENGTH = 32
const FEED_USER_LENGTH = 20
const FEED_TIME_LENGTH = 7
const FEED_LEVEL_LENGTH = 1
const FEED_HEADER_LENGTH = 8

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
