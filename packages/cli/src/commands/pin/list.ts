import { Command, DefaultFlags } from '../../Command'

export default class PinListCommand extends Command<DefaultFlags> {
  public static flags = Command.flags

  public async run(): Promise<void> {
    this.spinner.start('Loading pins...')

    try {
      const pins = await this.client.bzz.pins()
      if (pins.length === 0) {
        this.spinner.succeed('No pins')
      } else {
        this.spinner.succeed('Pins loaded:')
        this.logObject(pins)
      }
    } catch (err) {
      this.spinner.fail(err.message)
      process.exit()
    }
  }
}
