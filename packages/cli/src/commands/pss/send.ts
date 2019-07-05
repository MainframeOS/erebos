import { EMPTY_ADDRESS } from '@erebos/api-pss'
import { hexValue, isHexValue } from '@erebos/hex'
import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  address: hexValue
  key: hexValue
  topic: string
}

interface Args {
  message: string
}

export default class PssSendCommand extends Command<Flags, Args> {
  public static args = [
    {
      name: 'message',
      description: 'message to send',
      required: true,
    },
  ]

  public static flags = {
    ...Command.flags,
    address: flags.string({
      char: 'a',
      default: EMPTY_ADDRESS,
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

  public async run() {
    this.spinner.start()
    try {
      const topic = isHexValue(this.flags.topic)
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
