// @flow

import { flags } from '@oclif/command'

import Command from '../../Command'

export default class FeedManifestCommand extends Command {
  static args = [
    {
      name: 'user',
      description: 'user of the feed',
      required: true,
    },
  ]

  static flags = {
    ...Command.flags,
    name: flags.string({
      char: 'n',
      description: 'name of the feed',
    }),
    topic: flags.string({
      char: 'n',
      description: 'topic of the feed',
    }),
  }

  async run() {
    this.spinner.start('Creating feed manifest...')

    try {
      const hash = await this.client.bzz.createFeedManifest({
        user: this.args.user,
        name: this.flags.name,
        topic: this.flags.topic,
      })
      this.spinner.succeed(`Feed manifest created with hash: ${hash}`)
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
