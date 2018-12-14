import Bzz from '@erebos/api-bzz-node'
import Pss, { StreamRPC } from '@erebos/api-pss'
import BaseClient, { ClientConfig } from '@erebos/client-base'

export { createKeyPair, pubKeyToAddress } from '@erebos/api-bzz-base'
export { default as createHex, Hex } from '@erebos/hex'
export const BzzAPI = Bzz
export const PssAPI = Pss

export function createRPC(endpoint: string): StreamRPC

export interface SwarmConfig extends ClientConfig {
  bzz?: string | Bzz
  pss?: string | Pss
}

export class SwarmClient extends BaseClient {
  constructor(config: string | SwarmConfig)
  bzz: Bzz
  pss: Pss
}
