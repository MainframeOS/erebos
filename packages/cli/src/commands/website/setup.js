// @flow

import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { flags } from '@oclif/command'

import Command from '../../Command'

export default class WebsiteSetupCommand extends Command {
  static flags = {
    ...Command.flags,
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
    }),
    name: flags.string({
      description: 'feed name',
    }),
    topic: flags.string({
      description: 'feed topic',
    }),
  }

  async run() {
    this.spinner.start()
    try {
      const keyValue = process.env[this.flags['key-env']]
      const hasKey = keyValue != null && keyValue.length !== 0
      const keyPair = createKeyPair(hasKey ? keyValue : undefined, 'hex')

      const address = pubKeyToAddress(keyPair.getPublic())
      const hash = await this.client.bzz.createFeedManifest(address, {
        name: this.flags.name,
        topic: this.flags.topic,
      })
      const url = this.client.bzz.getDownloadURL(hash, { mode: 'default' })

      this.spinner.succeed(`Website setup with hash: ${hash} - ${url}`)
      if (!hasKey) {
        const privKey = keyPair.getPrivate('hex')
        this.warn(
          `A new private key has been created to publish this website: ${privKey}. DO NOT loose this key in order to be able to publish the website to this hash.`,
        )
      }
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
