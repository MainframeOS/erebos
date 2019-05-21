// @flow

import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { Timeline, createChapter } from '@erebos/timeline'
import { flags } from '@oclif/command'

import Command from '../../Command'

export default class TimelineAddCommand extends Command {
  static args = [
    {
      name: 'content',
      description: 'chapter content (JSON)',
      parse: JSON.parse,
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
      description: 'name of the timeline feed',
    }),
    type: flags.string({
      char: 't',
      description: 'type of the chapter content',
      default: 'application/json',
    }),
  }

  async run() {
    try {
      const keyPair = createKeyPair(this.flags['key-env'])
      const address = pubKeyToAddress(keyPair.getPublic().encode())
      const timeline = new Timeline({
        bzz: this.client.bzz,
        feed: {
          user: address,
          name: this.flags.name,
        },
        signParams: keyPair.getPrivate(),
      })

      let timelineInfo = `user "${address}"`
      if (this.flags.name != null) {
        timelineInfo += ` and name "${this.flags.name}"`
      }
      this.spinner.start(`Looking up timeline with ${timelineInfo}...`)

      const previous = await timeline.getLatestChapterID()
      if (previous === null) {
        this.spinner.fail('No chapter found for the provided feed parameters')
        return
      }

      this.spinner
        .succeed(`Found latest chapter ID: ${previous}`)
        .start(`Publishing new chapter to timeline...`)

      const chapter = createChapter({
        author: address,
        content: this.args.content,
        type: this.flags.type,
        previous,
      })
      const id = await timeline.setLatestChapter(chapter)
      this.spinner.succeed(
        `Timeline updated for ${timelineInfo} with chapter ID: ${id}`,
      )
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
