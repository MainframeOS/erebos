// @flow

import Command from '../../Command'

export default class PssKeyCommand extends Command {
  static flags = Command.flags

  async run() {
    this.spinner.start('Retrieving PSS public key')
    try {
      const key = await this.client.pss.getPublicKey()
      this.spinner.succeed(`PSS public key: ${key}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
