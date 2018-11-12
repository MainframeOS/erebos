// @flow

import { createKeyPair } from '@erebos/swarm-node'
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
      const keyPair = createKeyPair(process.env[this.flags['key-env']], 'hex')
      const [dataHash, feedMeta] = await Promise.all([
        this.client.bzz.uploadFrom(this.resolvePath(this.args.path), {
          defaultPath: 'index.html',
        }),
        this.client.bzz.getFeedMetadata(this.flags.hash),
      ])

      await this.client.bzz.postFeedValue(keyPair, `0x1b20${dataHash}`, {
        topic: feedMeta.feed.topic,
      })
      const url = this.client.bzz.getDownloadURL(this.flags.hash, {
        mode: 'default',
      })

      this.spinner.succeed(`Website published to: ${url}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
