import { pubKeyToAddress } from '@erebos/keccak256'
import { createKeyPair } from '@erebos/secp256k1'
import { flags } from '@oclif/command'

import { Command, DefaultFlags } from '../../Command'

interface Flags extends DefaultFlags {
  'key-env'?: string
}

export default class FeedUserCommand extends Command<Flags> {
  public static flags = {
    ...Command.flags,
    'key-env': flags.string({
      description:
        'name of the environment variable containing the private key',
      parse: key => (key && process.env[key]) || '',
    }),
  }

  public run(): any {
    try {
      const keyValue = this.flags['key-env']
      const hasKey = keyValue != null && keyValue.length !== 0
      const keyPair = createKeyPair(hasKey ? keyValue : undefined)
      const address = pubKeyToAddress(keyPair.getPublic('array'))
      this.log(`User address: ${address}`)

      if (!hasKey) {
        const privKey = keyPair.getPrivate('hex')
        this.warn(`A new private key has been created: ${privKey}`)
      }
    } catch (err) {
      this.error(err.message)
      process.exit()
    }
  }
}
