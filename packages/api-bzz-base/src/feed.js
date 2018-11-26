// @flow

import createHex, {
  type hexInput,
  type hexValue,
  hexValueType,
} from '@erebos/hex'
import elliptic from 'elliptic'
import sha3 from 'js-sha3'

import type { FeedMetadata, FeedOptions, KeyPair } from './types'

const FEED_TOPIC_LENGTH = 32
const FEED_USER_LENGTH = 20
const FEED_TIME_LENGTH = 7
const FEED_LEVEL_LENGTH = 1
const FEED_HEADER_LENGTH = 8

const ec = new elliptic.ec('secp256k1')

const toHexValue = (bytes: Array<number>): hexValue => {
  return hexValueType('0x' + Buffer.from(bytes).toString('hex'))
}

export const createFeedDigest = (
  meta: FeedMetadata,
  data: hexInput,
): Buffer => {
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
  return Buffer.from(sha3.keccak256.array(payload))
}

export const createKeyPair = (priv?: ?string, enc?: string): KeyPair => {
  return priv ? ec.keyFromPrivate(priv, enc) : ec.genKeyPair()
}

export const getFeedTopic = (options: FeedOptions): hexValue => {
  const topicHex = createHex(options.topic || Buffer.alloc(32))
  if (options.name == null) {
    return topicHex.value
  }

  const name = Buffer.from(options.name)
  const topic = topicHex.toBuffer()
  const bytes = Array(32)
    .fill()
    .map((_, i) => topic[i] ^ name[i])
  return toHexValue(bytes)
}

export const pubKeyToAddress = (pubKey: Object): hexValue => {
  const bytes = sha3.keccak256.array(pubKey.encode().slice(1)).slice(12)
  return toHexValue(bytes)
}

export const signFeedDigest = (digest: Buffer, privKey: Object): hexValue => {
  const bytes = Array.from(digest.values())
  const sig = ec.sign(bytes, privKey, { canonical: true })
  const signature = [
    ...sig.r.toArray('be', 32),
    ...sig.s.toArray('be', 32),
    sig.recoveryParam,
  ]
  return toHexValue(signature)
}

export const signFeedUpdate = (
  meta: FeedMetadata,
  data: hexInput,
  privKey: Object,
): hexValue => {
  return signFeedDigest(createFeedDigest(meta, data), privKey)
}
