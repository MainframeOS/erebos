// @flow

import { flags } from '@oclif/command'

import Command from '../../Command'

export default class BzzUploadCommand extends Command {
  static args = [
    {
      name: 'path',
      description: 'path of the file or folder to upload',
      default: './',
    },
  ]

  static flags = {
    ...Command.flags,
    'content-type': flags.string({
      description: 'content-type of the file',
    }),
  }

  async run() {
    this.spinner.start(`Uploading contents from: ${this.args.path}`)
    try {
      const hash = await this.client.bzz.uploadFrom(
        this.resolvePath(this.args.path),
        { contentType: this.flags['content-type'] },
      )
      this.spinner.succeed(`Contents successfully uploaded with hash: ${hash}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
