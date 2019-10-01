import cmd from '@oclif/command'
import updateNotifier from 'update-notifier'

import pkg from '../package.json'

updateNotifier({ pkg }).notify()

module.exports = cmd
