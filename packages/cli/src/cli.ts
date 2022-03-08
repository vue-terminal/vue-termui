import cac from 'cac'
import chalk from 'chalk'
import { version } from '../package.json'
import { runDevServer } from './commands/dev'

const cli = cac('vtui')

cli
  .version(version)
  .option('-c, --config <path>', 'path to vite config file')
  .help()

const TODO = () => {}

cli
  .command(
    'dev [entryFile]',
    'Runs a development server with HMR. "entryFile" defaults to src/main.ts.'
  )
  .usage('dev [src/main.ts]')
  .action(runDevServer)

cli
  .command(
    'build [entryFile]',
    'Build the application for production. "entryFile" defaults to src/main.ts.'
  )
  .usage('build [src/main.ts]')
  .action(TODO)

cli.on('command:*', () => {
  console.log()
  console.error(
    chalk.red.inverse(' ERROR ') + chalk.whiteBright(' Unknown command: %s'),
    cli.args.join(' ')
  )
  console.log()
  cli.outputHelp()
  process.exit(1)
})

cli.parse()
