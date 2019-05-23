// @flow

import { Timeline } from '@erebos/timeline'
import { flags } from '@oclif/command'

import Command from '../../Command'

export default class TimelineReadCommand extends Command {
  static flags = {
    ...Command.flags,
    chapter: flags.string({
      char: 'c',
      description: 'specific chapter ID',
      exclusive: ['user'],
    }),
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

  async run() {
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
      const timeline = new Timeline({ bzz: this.client.bzz, feed })
      this.spinner.succeed().start('Querying feed...')
      const id = this.flags.chapter || (await timeline.getLatestChapterID())
      if (id === null) {
        this.spinner.warn('No chapter found for the provided feed parameters')
      } else {
        const chapter = await timeline.getChapter(id)
        this.spinner.succeed(`Found chapter ID: ${id}`)
        this.logObject(chapter)
      }
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
