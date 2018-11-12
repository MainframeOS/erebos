// @flow

import Command from '../../Command'

export default class PssListenCommand extends Command {
  static args = [
    {
      name: 'topic',
      description: 'topic string or hex value',
      required: true,
    },
  ]

  static flags = Command.flags

  async run() {
    this.spinner.start()
    try {
      const topic =
        this.args.topic.slice(0, 2) === '0x'
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
