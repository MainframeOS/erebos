// @flow

import repl from 'repl'
import { flags } from '@oclif/command'

import Command from '../../Command'

export default class PssPeerCommand extends Command {
  static args = [
    {
      name: 'key',
      description: 'peer public key',
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
    topic: flags.string({
      char: 't',
      default: '0xaecc1868',
      description: 'topic string or hex value',
    }),
  }

  async run() {
    try {
      const topic =
        this.flags.topic.slice(0, 2) === '0x'
          ? this.flags.topic
          : await this.client.pss.stringToTopic(this.flags.topic)

      await this.client.pss.setPeerPublicKey(
        this.args.key,
        topic,
        this.flags.address,
      )
      const sub = await this.client.pss.createTopicSubscription(topic)

      const evalInput = async (msg, context, filename, cb) => {
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
        this.log('\n-> ' + event.msg.toString())
        r.displayPrompt(true)
      })

      await new Promise(resolve => {
        process.on('exit', resolve)
      })
    } catch (err) {
      this.error(err.message)
    }
  }
}
