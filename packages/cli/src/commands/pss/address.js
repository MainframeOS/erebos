// @flow

import Command from '../../Command'

export default class PssAddressCommand extends Command {
  static flags = Command.flags

  async run() {
    this.spinner.start('Retrieving PSS base address')
    try {
      const address = await this.client.pss.baseAddr()
      this.spinner.succeed(`PSS base address: ${address}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
