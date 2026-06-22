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

  /**
   * Switches the current screen buffer when mounting the app and restores it when exiting. This is useful for
   * fullscreen applications and applications relying on mouse coordinates.Using this will always display the app at the
   * top left corner.
   */
  swapScreens?: boolean
}

export type RootProps = Record<string, unknown>
