// @flow

import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { flags } from '@oclif/command'

import Command from '../../Command'

export default class FeedSetCommand extends Command {
  static args = [
    {
      name: 'value',
      description: 'feed chunk value',
      required: true,
    },
  ]

  static flags = {
    ...Command.flags,
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
      parse: key => process.env[key],
      required: true,
    }),
    name: flags.string({
      char: 'n',
      description: 'name of the feed',
    }),
  }

  async run() {
    try {
      const keyPair = createKeyPair(this.flags['key-env'])
      const address = pubKeyToAddress(keyPair.getPublic().encode())
      this.spinner.start('Publishing to feed...')

      await this.client.bzz.setFeedChunk(
        { user: address, name: this.flags.name },
        this.args.value,
        {},
        keyPair.getPrivate(),
      )
      this.spinner.succeed('Feed updated')
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
