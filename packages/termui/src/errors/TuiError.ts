import { Signal } from "../deps/signal-exit"

export class TuiError extends Error {
  code: number | null
  signal: Signal | null

  constructor(code: number | null, signal: Signal | null) {
    super(`Program Interrupted with "${signal}" ${code ? `(${code})` : ''}`)
    this.code = code
    this.signal = signal
  }
}
