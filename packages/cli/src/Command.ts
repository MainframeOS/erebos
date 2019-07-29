import { resolve } from 'path'
import { inspect } from 'util'
import { sign } from '@erebos/secp256k1'
import { SwarmClient } from '@erebos/swarm-node'
import { Command as Cmd, flags } from '@oclif/command'
import ora from 'ora'

export interface DefaultFlags extends Record<string, any> {
  'http-gateway': string
  'ipc-path': string
  'ws-url': string
  timeout: number
}

export abstract class Command<
  Flags extends Record<string, any>,
  Args extends Record<string, any> = Record<string, any>
> extends Cmd {
  public static flags = {
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
    timeout: flags.integer({
      parse: input => parseInt(input, 10) * 1000,
    }),
  }

  private clientInstance: SwarmClient | null = null

  public args!: Args
  public flags!: Flags
  public spinner!: ora.Ora

  public get client(): SwarmClient {
    if (this.clientInstance == null) {
      this.clientInstance = new SwarmClient({
        bzz: {
          signBytes: async (bytes: Array<number>, key: any) => sign(bytes, key),
          timeout: this.flags.timeout,
          url: this.flags['http-gateway'],
        },
        ipc: this.flags['ipc-path'],
        ws: this.flags['ws-url'],
      })
    }
    return this.clientInstance
  }

  public resolvePath(path: string): string {
    return resolve(process.cwd(), path)
  }

  public logObject(data: Record<string, any>) {
    this.log(inspect(data, { colors: true, depth: null }))
  }

  public async init() {
    // @ts-ignore
    const { args, flags } = this.parse(this.constructor)
    this.args = args
    this.flags = flags
    this.spinner = ora()
  }

  public async finally() {
    if (this.clientInstance != null) {
      this.clientInstance.disconnect()
    }
  }
}
