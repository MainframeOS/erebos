// @flow

import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { flags } from '@oclif/command'

import Command from '../../Command'

export default class FeedUserCommand extends Command {
  static flags = {
    ...Command.flags,
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
      parse: key => (key ? process.env[key] : undefined),
    }),
  }

  async run() {
    try {
      const keyValue = this.flags['key-env']
      const hasKey = keyValue != null && keyValue.length !== 0
      const keyPair = createKeyPair(hasKey ? keyValue : undefined)

      if (!hasKey) {
        const privKey = keyPair.getPrivate('hex')
        this.warn(`A new private key has been created: ${privKey}`)
      }

      const address = pubKeyToAddress(keyPair.getPublic().encode())
      this.log(`User address: ${address}`)
    } catch (err) {
      this.error(err.message)
      process.exit()
    }
  }
}
