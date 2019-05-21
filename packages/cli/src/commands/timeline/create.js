// @flow

import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { Timeline, createChapter } from '@erebos/timeline'
import { flags } from '@oclif/command'

import Command from '../../Command'

export default class TimelineCreateCommand extends Command {
  static args = [
    {
      name: 'content',
      description: 'chapter content (JSON)',
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
    manifest: flags.boolean({
      char: 'm',
      default: true,
      description: 'create a feed manifest',
    }),
  }

  async run() {
    try {
      const keyPair = createKeyPair(this.flags['key-env'])
      const address = pubKeyToAddress(keyPair.getPublic().encode())
      let hash

      if (this.flags.manifest) {
        this.spinner.start('Creating feed manifest...')
        hash = await this.client.bzz.createFeedManifest({
          user: address,
          name: this.flags.name,
        })
        this.spinner.succeed(`Feed manifest created with hash: ${hash}`)
      }

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
      if (hash != null) {
        timelineInfo += ` (feed hash "${hash}")`
      }
      this.spinner.start(`Creating timeline for ${timelineInfo}...`)

      const chapter = createChapter({
        author: address,
        content: this.args.content,
        type: this.flags.type,
      })
      const id = await timeline.setLatestChapter(chapter)
      this.spinner.succeed(
        `Timeline created for ${timelineInfo} with chapter ID: ${id}`,
      )
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
