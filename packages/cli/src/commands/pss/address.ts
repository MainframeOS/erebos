import { Command, DefaultFlags } from '../../Command'

export default class PssAddressCommand extends Command<DefaultFlags> {
  public static flags = Command.flags

  public async run(): Promise<void> {
    this.spinner.start('Retrieving PSS base address')
    try {
      const address = await this.client.pss.baseAddr()
      this.spinner.succeed(`PSS base address: ${address}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
