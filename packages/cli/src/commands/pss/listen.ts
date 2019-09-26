import { isHexValue } from '@erebos/hex'

import { Command, DefaultFlags } from '../../Command'

interface Args {
  topic: string
}

export default class PssListenCommand extends Command<DefaultFlags, Args> {
  public static args = [
    {
      name: 'topic',
      description: 'topic string or hex value',
      required: true,
    },
  ]

  public static flags = Command.flags

  public async run(): Promise<void> {
    this.spinner.start()
    try {
      const topic = isHexValue(this.args.topic)
        ? this.args.topic
        : await this.client.pss.stringToTopic(this.args.topic)

      const sub = await this.client.pss.createTopicSubscription(topic)
      sub.subscribe(event => {
        this.log(`${event.key}: ${event.msg.toString()}`)
      })
      this.spinner.succeed(`Listening on PSS topic: ${topic}`)

      await new Promise(resolve => {
        process.on('exit', resolve)
      })
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
