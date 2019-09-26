import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  'key-env': string
  name?: string
}

interface Args {
  value: string
}

export default class FeedSetCommand extends Command<Flags, Args> {
  public static args = [
    {
      name: 'value',
      description: 'feed chunk value',
      required: true,
    },
  ]

  public static flags = {
    ...Command.flags,
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
      parse: key => process.env[key] as string,
      required: true,
    }),
    name: flags.string({
      char: 'n',
      description: 'name of the feed',
    }),
  }

  public async run(): Promise<void> {
    try {
      const keyPair = createKeyPair(this.flags['key-env'])
      const address = pubKeyToAddress(keyPair.getPublic('array'))
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
