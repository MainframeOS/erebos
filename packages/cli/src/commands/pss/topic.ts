import { Command, DefaultFlags } from '../../Command'

interface Args {
  topic: string
}

export default class PssTopicCommand extends Command<DefaultFlags, Args> {
  public static args = [
    {
      name: 'topic',
      description: 'topic string',
      required: true,
    },
  ]

  public static flags = Command.flags

  public async run() {
    this.spinner.start(`Retrieving PSS topic for string: ${this.args.topic}`)
    try {
      const topic = await this.client.pss.stringToTopic(this.args.topic)
      this.spinner.succeed(`PSS topic for "${this.args.topic}" is: ${topic}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
