import { Writable } from 'stream'
import ansiEscapes from 'ansi-escapes'
import cliCursor from 'cli-cursor'

export interface LogUpdate {
  clear: () => void
  done: () => void
  (...strs: string[]): void
}

export function createLog(
  stream: Writable,
  { showCursor = false } = {}
): LogUpdate {
  let previousLineCount = 0
  let previousOutput = ''
  let hasHiddenCursor = false

  const render = (...strs: string[]) => {
    if (!showCursor && !hasHiddenCursor) {
      cliCursor.hide()
      hasHiddenCursor = true
    }

    const output = strs.join(' ') + '\n'
    if (output === previousOutput) {
      return
    }

    previousOutput = output
    stream.write(ansiEscapes.eraseLines(previousLineCount) + output)
    previousLineCount = output.split('\n').length
  }

  render.clear = () => {
    stream.write(ansiEscapes.eraseLines(previousLineCount))
    previousOutput = ''
    previousLineCount = 0
  }

  render.done = () => {
    previousOutput = ''
    previousLineCount = 0

    if (!showCursor) {
      cliCursor.show()
      hasHiddenCursor = false
    }
  }

  return render
}
