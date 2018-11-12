// @flow

import { flags } from '@oclif/command'

import Command from '../../Command'

export default class PssSendCommand extends Command {
  static args = [
    {
      name: 'message',
      description: 'message to send',
      required: true,
    },
  ]

  static flags = {
    ...Command.flags,
    address: flags.string({
      char: 'a',
      default: '0x',
      description: 'peer address',
    }),
    key: flags.string({
      char: 'k',
      description: 'peer public key',
      required: true,
    }),
    topic: flags.string({
      char: 't',
      description: 'topic string or hex value',
      required: true,
    }),
  }

  async run() {
    this.spinner.start()
    try {
      const topic =
        this.flags.topic.slice(0, 2) === '0x'
          ? this.flags.topic
          : await this.client.pss.stringToTopic(this.flags.topic)

      await this.client.pss.setPeerPublicKey(
        this.flags.key,
        topic,
        this.flags.address,
      )
      await this.client.pss.sendAsym(this.flags.key, topic, this.args.message)

      this.spinner.succeed('Message sent!')
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
