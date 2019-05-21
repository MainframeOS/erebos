// @flow

import { resolve } from 'path'
import { sign } from '@erebos/secp256k1'
import { SwarmClient } from '@erebos/swarm-node'
import { Command as Cmd, flags } from '@oclif/command'
import ora from 'ora'

export default class Command extends Cmd {
  static flags = {
    'http-gateway': flags.string({
      default: 'http://localhost:8500',
      env: 'EREBOS_HTTP_GATEWAY',
    }),
    'ipc-path': flags.string({
      env: 'EREBOS_IPC_PATH',
    }),
    'ws-url': flags.string({
      default: 'ws://localhost:8546',
      env: 'EREBOS_WS_URL',
    }),
  }

  _client: ?SwarmClient

  get client(): SwarmClient {
    if (this._client == null) {
      this._client = new SwarmClient({
        bzz: {
          signBytes: async (bytes, key) => sign(bytes, key),
          url: this.flags['http-gateway'],
        },
        ipc: this.flags['ipc-path'],
        ws: this.flags['ws-url'],
      })
    }
    return this._client
  }

  resolvePath(path: string): string {
    return resolve(process.cwd(), path)
  }

  async init() {
    const { args, flags } = this.parse(this.constructor)
    this.args = args
    this.flags = flags
    this.spinner = ora()
  }

  async finally() {
    if (this._client != null) {
      this._client.disconnect()
    }
  }
}
