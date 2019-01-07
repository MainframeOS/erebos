import { BzzConfig } from '@erebos/api-bzz-base'
import Bzz from '@erebos/api-bzz-browser'
import Pss, { StreamRPC } from '@erebos/api-pss'
import BaseClient, { ClientConfig } from '@erebos/client-base'

export { default as createHex, Hex } from '@erebos/hex'
export { default as BzzAPI } from '@erebos/api-bzz-browser'
export { default as PssAPI } from '@erebos/api-pss'

export function createRPC(endpoint: string): StreamRPC

export interface SwarmConfig extends ClientConfig {
  bzz?: BzzConfig | Bzz
  pss?: string | Pss
}

export class SwarmClient extends BaseClient {
  constructor(config: SwarmConfig)
  bzz: Bzz
  pss: Pss
}
