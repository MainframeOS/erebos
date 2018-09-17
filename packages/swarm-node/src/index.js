// @flow

// Re-exports from imported libraries
export { default as BzzAPI } from '@erebos/api-bzz-node'
export { default as PssAPI } from '@erebos/api-pss'
export { default as createRPC } from '@mainframe/rpc-node'
export { hexType, hexEmpty, encodeHex, decodeHex } from '@mainframe/utils-hex'
export type { hex } from '@mainframe/utils-hex'

export type { SwarmConfig } from './Client'
export { default as SwarmClient } from './Client'
