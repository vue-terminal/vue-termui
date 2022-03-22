import { Writable } from 'stream'
import ansiEscapes from 'ansi-escapes'
import cliCursor from 'cli-cursor'
import { DOMElement } from './dom'
import { applyStyles } from './styles'
import type { OutputTransformer } from './Output'

export interface LogUpdate {
  clear: () => void
  done: () => void
  (text: string): void
}

export function createLog(
  stream: Writable,
  { showCursor = false } = {}
): LogUpdate {
  let previousLineCount = 0
  let previousOutput = ''
  let hasHiddenCursor = false

  const render = (text: string) => {
    if (!showCursor && !hasHiddenCursor) {
      cliCursor.hide()
      hasHiddenCursor = true
    }

    const output = text + '\n'
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
