import { Command, DefaultFlags } from '../../Command'

interface Args {
  hash: string
}

export default class PinRemoveCommand extends Command<DefaultFlags, Args> {
  public static args = [
    {
      name: 'hash',
      description: 'resource hash or ENS address',
    },
  ]

  public static flags = Command.flags

  public async run() {
    this.spinner.start('Removing pin...')

    try {
      await this.client.bzz.unpin(this.args.hash)
      this.spinner.succeed('Pin removed')
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
