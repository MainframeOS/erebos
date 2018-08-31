// @flow

import Command from '../../Command'

export default class BzzUploadCommand extends Command {
  static args = [
    {
      name: 'path',
      description: 'path of the folder to upload',
      default: './',
    },
  ]

  static flags = Command.flags

  async run() {
    this.spinner.start(`Uploading contents from: ${this.args.path}`)
    try {
      const hash = await this.client.bzz.uploadDirectoryFrom(
        this.resolvePath(this.args.path),
      )
      this.spinner.succeed(`Contents successfully uploaded with hash: ${hash}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
