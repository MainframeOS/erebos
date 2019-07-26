import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  name?: string
  topic?: string
}

interface Args {
  user: string
}

export default class FeedManifestCommand extends Command<Flags, Args> {
  public static args = [
    {
      name: 'user',
      description: 'user of the feed',
      required: true,
    },
  ]

  public static flags = {
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

  public async run() {
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
