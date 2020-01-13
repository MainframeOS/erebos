import { resolve } from 'path'
import { inspect } from 'util'
import { BzzFeed } from '@erebos/bzz-feed'
import { BzzFS } from '@erebos/bzz-fs'
import { sign } from '@erebos/secp256k1'
import { SwarmClient } from '@erebos/swarm-node'
import { Command as Cmd, flags } from '@oclif/command'
import { Response } from 'node-fetch'
// eslint-disable-next-line import/default
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
          timeout: this.flags.timeout,
          url: this.flags['http-gateway'],
        },
        ipc: this.flags['ipc-path'],
        ws: this.flags['ws-url'],
      })
    }
    return this.clientInstance
  }

  public getBzzFeed(): BzzFeed<NodeJS.ReadableStream, Response> {
    return new BzzFeed({
      bzz: this.client.bzz,
      signBytes: (bytes: Array<number>, key: any) => {
        return Promise.resolve(sign(bytes, key))
      },
    })
  }

  public getBzzFS(): BzzFS {
    return new BzzFS({
      basePath: process.cwd(),
      bzz: this.client.bzz,
    })
  }

  public resolvePath(path: string): string {
    return resolve(process.cwd(), path)
  }

  public logObject(data: Record<string, any>): void {
    this.log(inspect(data, { colors: true, depth: null }))
  }

  public init(): Promise<void> {
    // @ts-ignore
    const { args, flags } = this.parse(this.constructor)
    this.args = args
    this.flags = flags
    this.spinner = ora()
    return Promise.resolve()
  }

  public finally(): Promise<void> {
    if (this.clientInstance != null) {
      this.clientInstance.disconnect()
    }
    return Promise.resolve()
  }
}
