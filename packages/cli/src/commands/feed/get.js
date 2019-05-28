// @flow

import { flags } from '@oclif/command'

import Command from '../../Command'

export default class FeedGetCommand extends Command {
  static flags = {
    ...Command.flags,
    hash: flags.string({
      char: 'h',
      description: 'hash of the feed',
      exclusive: ['user'],
    }),
    user: flags.string({
      char: 'u',
      description: 'user of the feed',
      exclusive: ['hash'],
    }),
    name: flags.string({
      char: 'n',
      dependsOn: ['user'],
      description: 'name of the feed',
    }),
    type: flags.string({
      char: 'c',
      description: 'content type',
      options: ['hash', 'json', 'text'],
      default: 'text',
    }),
  }

  async run() {
    this.spinner.start('Retrieving feed...')

    try {
      const feed = this.flags.hash || {
        user: this.flags.user,
        name: this.flags.name,
      }

      if (this.flags.type === 'hash') {
        const hash = await this.client.bzz.getFeedContentHash(feed)
        this.spinner.succeed(`Feed content hash: ${hash}`)
      } else {
        const res = await this.client.bzz.getFeedChunk(feed)
        if (this.flags.type === 'json') {
          const json = await res.json()
          this.spinner.succeed('Feed content loaded')
          this.logObject(json)
        } else {
          const text = await res.text()
          this.spinner.succeed(`Feed content: ${text}`)
        }
      }
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
