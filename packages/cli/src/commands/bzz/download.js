// @flow

import { dirname, join } from 'path'
import { flags } from '@oclif/command'
import { ensureDir, lstat, writeFile } from 'fs-extra'

import Command from '../../Command'

const createFile = async (path: string): Promise<void> => {
  await ensureDir(dirname(path))
  await writeFile(path, '')
}

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
      description: 'path of the file or folder to download',
      default: './',
    }),
    raw: flags.boolean({
      description: 'download a raw file',
    }),
  }

  async run() {
    this.spinner.start(`Downloading contents from: ${this.args.hash}`)
    const options = {}
    let toPath = this.resolvePath(this.flags.path)

    if (this.flags.raw) {
      // Single file in raw mode
      options.mode = 'raw'
      try {
        const stat = await lstat(toPath)
        if (stat.isDirectory()) {
          // Destination is a directory, use the hash as file name
          toPath = join(toPath, this.args.hash)
          await createFile(toPath)
        } else if (!stat.isFile()) {
          // Ensure destination path is valid if existing
          return this.spinner.fail('Destination path is not a file')
        }
      } catch (err) {
        // File doesn't exist, create an empty one
        await createFile(toPath)
      }
    } else {
      // Destination should be a directory
      try {
        const stat = await lstat(toPath)
        if (!stat.isDirectory()) {
          return this.spinner.fail('Destination path is not a directory')
        }
      } catch (err) {
        // Directory doesn't exist, create an empty one
        await ensureDir(toPath)
      }
    }

    try {
      await this.client.bzz.downloadTo(this.args.hash, toPath, options)
      this.spinner.succeed(`Contents successfully downloaded to: ${toPath}`)
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
