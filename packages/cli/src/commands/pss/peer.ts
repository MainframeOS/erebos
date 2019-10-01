import repl from 'repl'
import { EMPTY_ADDRESS } from '@erebos/api-pss'
import { isHexValue, hexValue } from '@erebos/hex'
import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  address: hexValue
  topic: string
}

interface Args {
  key: hexValue
}

export default class PssPeerCommand extends Command<Flags, Args> {
  public static args = [
    {
      name: 'key',
      description: 'peer public key',
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
    topic: flags.string({
      char: 't',
      default: '0xaecc1868',
      description: 'topic string or hex value',
    }),
  }

  public async run(): Promise<void> {
    try {
      const topic = isHexValue(this.flags.topic)
        ? this.flags.topic
        : await this.client.pss.stringToTopic(this.flags.topic)

      await this.client.pss.setPeerPublicKey(
        this.args.key,
        topic,
        this.flags.address,
      )
      const sub = await this.client.pss.createTopicSubscription(topic)

      const evalInput = async (
        msg: string,
        context: any,
        file: string,
        cb: (err: Error | null, result?: any) => void,
      ): Promise<void> => {
        try {
          await this.client.pss.sendAsym(this.args.key, topic, msg.trim())
          cb(null)
        } catch (err) {
          cb(err)
        }
      }
      const r = repl.start({ eval: evalInput, prompt: '<- ' })
      r.on('exit', () => {
        process.exit()
      })

      sub.subscribe(event => {
        if (event.key === this.args.key) {
          this.log('\n-> ' + event.msg.toString())
          r.displayPrompt(true)
        }
      })

      await new Promise(resolve => {
        process.on('exit', resolve)
      })
    } catch (err) {
      this.error(err.message)
    }
  }
}
