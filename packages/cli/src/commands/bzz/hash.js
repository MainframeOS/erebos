// @flow

import Command from '../../Command'

export default class BzzHashCommand extends Command {
  static args = [
    {
      name: 'domain',
      description: 'ENS domain',
      required: true,
    },
  ]

  static flags = Command.flags

  async run() {
    this.spinner.start(`Retrieving hash for domain: ${this.args.domain}`)
    try {
      const hash = await this.client.bzz.hash(this.args.domain)
      this.spinner.succeed(`Hash for domain ${this.args.domain}: ${hash}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
