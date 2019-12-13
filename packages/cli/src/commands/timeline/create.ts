import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { TimelineWriter, createChapter } from '@erebos/timeline'
import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  'key-env': string
  name?: string
  type: string
  manifest?: boolean
}

interface Args {
  content: string
}

export default class TimelineCreateCommand extends Command<Flags, Args> {
  public static args = [
    {
      name: 'content',
      description: 'chapter content (JSON by default)',
      required: true,
    },
  ]

  public static flags = {
    ...Command.flags,
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
      parse: key => (key && process.env[key]) || '',
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
      description: 'create a feed manifest',
    }),
  }

  public async run(): Promise<void> {
    try {
      const keyValue = this.flags['key-env']
      const hasKey = keyValue != null && keyValue.length !== 0
      const keyPair = createKeyPair(hasKey ? keyValue : undefined)
      const address = pubKeyToAddress(keyPair.getPublic('array'))
      let hash

      if (this.flags.manifest) {
        this.spinner.start('Creating feed manifest...')
        hash = await this.client.bzz.createFeedManifest({
          user: address,
          name: this.flags.name,
        })
        this.spinner.succeed(`Feed manifest created with hash: ${hash}`)
      }

      const timeline = new TimelineWriter({
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

      const content =
        this.flags.type === 'application/json'
          ? JSON.parse(this.args.content)
          : this.args.content
      const chapter = createChapter({
        author: address,
        content,
        type: this.flags.type,
      })
      const id = await timeline.setLatestChapter(chapter)
      this.spinner.succeed(
        `Timeline created for ${timelineInfo} with chapter ID: ${id}`,
      )

      if (!hasKey) {
        const privKey = keyPair.getPrivate('hex')
        this.warn(
          `A new private key has been created for this timeline: ${privKey}. DO NOT lose this key in order to be able to add chapters to this timeline.`,
        )
      }
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
