import cac from 'cac'
import c from 'picocolors'
import { runDevServer } from './commands/dev'
import { buildCommand } from './commands/build'
import { version } from '../package.json'

const cli = cac('vtui')

cli
  .version(version)
  .option('-c, --config <path>', 'path to vite config file')
  .help()

cli.command('[entryFile]', 'Same as build command').action(buildCommand)

cli
  .command(
    'build [entryFile]',
    'Build the application for production. "entryFile" defaults to src/main.ts.'
  )
  .usage('build [src/main.ts]')
  .action(buildCommand)

cli
  .command(
    'dev [entryFile]',
    'Runs a development server with HMR. "entryFile" defaults to src/main.ts.'
  )
  .usage('dev [src/main.ts]')
  .action(runDevServer)

cli.on('command:*', () => {
  console.log()
  console.error(
    c.inverse(c.red(' ERROR ')) + c.white(' Unknown command: %s'),
    cli.args.join(' ')
  )
  console.log()
  cli.outputHelp()
  process.exit(1)
})

// TODO: maybe https://github.com/cacjs/cac#error-handling
cli.parse()
