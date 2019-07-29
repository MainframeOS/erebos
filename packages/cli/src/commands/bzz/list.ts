import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  path?: string
}

interface Args {
  hash: string
}

export default class BzzListCommand extends Command<Flags, Args> {
  public static args = [
    {
      name: 'hash',
      description: 'manifest hash or ENS address',
      required: true,
    },
  ]

  public static flags = {
    ...Command.flags,
    path: flags.string({
      description: 'file path in the manifest',
    }),
  }

  public async run() {
    let text = `Retrieving list for ${this.args.hash}`
    if (this.flags.path != null) {
      text += `/${this.flags.path}`
    }
    this.spinner.start(text)
    try {
      const data = await this.client.bzz.list(this.args.hash, {
        path: this.flags.path,
      })
      this.spinner.succeed()
      this.logObject(data)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
