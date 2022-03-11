import { App } from '@vue/runtime-core'

type TODO = any

export interface TuiAppMountOptions {
  /**
   * Render the application once and exit.
   *
   * @defaultValue `false`
   */
  renderOnce: boolean

  /**
   * Exits on ctrl-c.
   *
   * @defaultValue `true`
   */
  exitOnCtrlC: boolean
}

export interface TuiApp extends Omit<App<TODO>, 'mount'> {
  mount(options?: Partial<TuiAppMountOptions>): TuiApp

  waitUntilExit(): Promise<void>
}

export interface TuiAppOptions {
  /**
   * Output stream where app will be rendered.
   *
   * @default process.stdout
   */
  stdout?: NodeJS.WriteStream
  /**
   * Input stream where app will listen for input.
   *
   * @default process.stdin
   */
  stdin?: NodeJS.ReadStream
  /**
   * Error stream.
   * @default process.stderr
   */
  stderr?: NodeJS.WriteStream
}

export type RootProps = Record<string, unknown>
