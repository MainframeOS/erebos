import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  'key-env'?: string
  name?: string
  topic?: string
}

export default class WebsiteSetupCommand extends Command<Flags> {
  public static flags = {
    ...Command.flags,
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
      parse: key => (key && process.env[key]) || '',
    }),
    name: flags.string({
      description: 'feed name',
    }),
    topic: flags.string({
      description: 'feed topic',
    }),
  }

  public async run() {
    this.spinner.start()
    try {
      const keyValue = this.flags['key-env']
      const hasKey = keyValue != null && keyValue.length !== 0
      const keyPair = createKeyPair(hasKey ? keyValue : undefined)

      const hash = await this.client.bzz.createFeedManifest({
        user: pubKeyToAddress(keyPair.getPublic('array')),
        name: this.flags.name,
        topic: this.flags.topic,
      })
      const url = this.client.bzz.getDownloadURL(hash, { mode: 'default' })

      this.spinner.succeed(`Website setup with hash: ${hash} - ${url}`)
      if (!hasKey) {
        const privKey = keyPair.getPrivate('hex')
        this.warn(
          `A new private key has been created to publish this website: ${privKey}. DO NOT lose this key in order to be able to publish the website to this hash.`,
        )
      }
    } catch (err) {
      this.spinner.fail(err.message)
    }
  }
}
