import { Command, DefaultFlags } from '../../Command'

interface Args {
  domain: string
}

export default class BzzHashCommand extends Command<DefaultFlags, Args> {
  public static args = [
    {
      name: 'domain',
      description: 'ENS domain',
      required: true,
    },
  ]

  public static flags = Command.flags

  public async run() {
    this.spinner.start(`Retrieving hash for domain: ${this.args.domain}`)
    try {
      const hash = await this.client.bzz.hash(this.args.domain)
      this.spinner.succeed(`Hash for domain ${this.args.domain}: ${hash}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
