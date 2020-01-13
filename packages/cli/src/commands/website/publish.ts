import { createKeyPair } from '@erebos/secp256k1'
import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  hash: string
  'key-env': string
}

interface Args {
  path: string
}

export default class WebsitePublishCommand extends Command<Flags, Args> {
  public static args = [
    {
      name: 'path',
      description: 'path of the folder to upload',
      default: './',
    },
  ]

  public static flags = {
    ...Command.flags,
    hash: flags.string({
      description: 'manifest hash of the website',
      required: true,
    }),
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
      parse: key => process.env[key] || '',
      required: true,
    }),
  }

  public async run(): Promise<void> {
    this.spinner.start('Publishing website contents...')
    const bzzFeed = this.getBzzFeed()
    try {
      const keyPair = createKeyPair(this.flags['key-env'])

      const [dataHash, feedMeta] = await Promise.all([
        this.getBzzFS().uploadFrom(this.args.path, {
          defaultPath: 'index.html',
        }),
        bzzFeed.getMetadata(this.flags.hash),
      ])
      await bzzFeed.postChunk(
        feedMeta,
        `0x${dataHash}`,
        {},
        keyPair.getPrivate(),
      )

      const url = this.client.bzz.getDownloadURL(this.flags.hash, {
        mode: 'default',
      })
      this.spinner.succeed(`Website published to: ${url}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
