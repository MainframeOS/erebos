// @flow

// Re-exports from imported libraries
export { default as rpc } from '@mainframe/rpc-browser'
export { hexType, hexEmpty, encodeHex, decodeHex } from '@mainframe/utils-hex'
export { default as BzzAPI } from 'erebos-api-bzz-browser'
export { default as EthAPI } from 'erebos-api-eth'
export { default as NetAPI } from 'erebos-api-net'
export { default as PssAPI } from 'erebos-api-pss'
export { default as ShhAPI } from 'erebos-api-shh'
export { default as Web3API } from 'erebos-api-web3'

// Types
// eslint-disable-next-line import/named
export type { hex } from '@mainframe/utils-hex'
// eslint-disable-next-line import/named
export type { ClientConfig } from 'erebos-client-base'

export { default as Client } from './Client'
