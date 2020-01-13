import { TimelineReader } from '@erebos/timeline'
import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  hash?: string
  user?: string
  name?: string
}

export default class TimelineLookupCommand extends Command<Flags> {
  public static flags = {
    ...Command.flags,
    hash: flags.string({
      char: 'h',
      description: 'hash of the timeline feed',
      exclusive: ['user'],
    }),
    user: flags.string({
      char: 'u',
      description: 'user of the timeline feed',
      exclusive: ['hash'],
    }),
    name: flags.string({
      char: 'n',
      dependsOn: ['user'],
      description: 'name of the timeline feed',
    }),
  }

  public async run(): Promise<void> {
    this.spinner.start('Checking input parameters')
    let feed
    if (this.flags.hash != null) {
      feed = this.flags.hash
    } else if (this.flags.user != null) {
      feed = {
        user: this.flags.user,
        name: this.flags.name,
      }
    } else {
      this.spinner.fail(
        'Invalid parameters: expected "hash" or "user" flag to be provided',
      )
      return
    }
    try {
      const timeline = new TimelineReader({ bzz: this.getBzzFeed(), feed })
      this.spinner.succeed().start('Querying feed...')
      const id = await timeline.getLatestChapterID()
      if (id === null) {
        this.spinner.warn('No chapter found for the provided feed parameters')
      } else {
        this.spinner.succeed(`Found chapter ID: ${id}`)
      }
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
