// @flow

import BzzAPI from '@erebos/api-bzz-node'
import { createKeyPair, sign } from '@erebos/secp256k1'
import { flags } from '@oclif/command'

import Command from '../../Command'

export default class WebsitePublishCommand extends Command {
  static args = [
    {
      name: 'path',
      description: 'path of the folder to upload',
      default: './',
    },
  ]

  static flags = {
    ...Command.flags,
    hash: flags.string({
      description: 'manifest hash of the website',
      required: true,
    }),
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
      required: true,
    }),
  }

  async run() {
    this.spinner.start('Publishing website contents...')
    try {
      const keyPair = createKeyPair(process.env[this.flags['key-env']])
      const bzz = new BzzAPI({
        signFeedDigest: async digest => sign(digest, keyPair.getPrivate()),
        url: this.flags['http-gateway'],
      })

      const [dataHash, feedMeta] = await Promise.all([
        bzz.uploadFrom(this.resolvePath(this.args.path), {
          defaultPath: 'index.html',
        }),
        bzz.getFeedMetadata(this.flags.hash),
      ])
      await bzz.postFeedValue(feedMeta, `0x${dataHash}`)

      const url = bzz.getDownloadURL(this.flags.hash, { mode: 'default' })
      this.spinner.succeed(`Website published to: ${url}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
