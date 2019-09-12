import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  download: boolean
  raw: boolean
}

interface Args {
  hash: string
}

export default class PinAddCommand extends Command<Flags, Args> {
  public static args = [
    {
      name: 'hash',
      description: 'resource hash or ENS address',
    },
  ]

  public static flags = {
    ...Command.flags,
    download: flags.boolean({
      char: 'd',
      description: 'download resource before adding pin',
      default: false,
    }),
    raw: flags.boolean({
      char: 'r',
      description: 'raw file',
      default: false,
    }),
  }

  public async run() {
    this.spinner.start('Adding pin...')

    try {
      await this.client.bzz.pin(this.args.hash, {
        download: this.flags.download,
        raw: this.flags.raw,
      })
      this.spinner.succeed('Pin added')
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
