// @flow

import Command from '../../Command'

export default class PssTopicCommand extends Command {
  static args = [
    {
      name: 'topic',
      description: 'topic string',
      required: true,
    },
  ]

  static flags = Command.flags

  async run() {
    this.spinner.start(`Retrieving PSS topic for string: ${this.args.topic}`)
    try {
      const topic = await this.client.pss.stringToTopic(this.args.topic)
      this.spinner.succeed(`PSS topic for "${this.args.topic}" is: ${topic}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
