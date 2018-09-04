// @flow

import { flags } from '@oclif/command'

import Command from '../../Command'

export default class BzzDownloadCommand extends Command {
  static args = [
    {
      name: 'hash',
      description: 'manifest hash or ENS address',
      required: true,
    },
  ]

  static flags = {
    ...Command.flags,
    path: flags.string({
      description: 'path of the folder to download',
      default: './',
    }),
  }

  async run() {
    this.spinner.start(`Downloading contents from: ${this.args.hash}`)
    try {
      await this.client.bzz.downloadDirectoryTo(
        this.args.hash,
        this.resolvePath(this.flags.path),
      )
      this.spinner.succeed(
        `Contents successfully downloaded to: ${this.flags.path}`,
      )
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
