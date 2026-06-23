// File logging for the terminal app. The renderer owns the screen, so anything
// written to the console is invisible (and OpenTUI captures it into an overlay
// that's awkward to read). This mirrors console output and uncaught errors into
// plain files so we can `tail -f` them while the app runs:
//
//   playground/logs/out.log   ← console.log / info / debug
//   playground/logs/err.log   ← console.warn / error + uncaught errors/rejections
//
// Writes are synchronous (writeSync to an appended fd) so the last lines survive
// even when the process crashes.
import { mkdirSync, openSync, writeSync } from 'node:fs'
import { resolve } from 'node:path'
import { formatWithOptions } from 'node:util'

const LOG_DIR = resolve(process.cwd(), 'logs')
mkdirSync(LOG_DIR, { recursive: true })

const outFd = openSync(resolve(LOG_DIR, 'out.log'), 'a')
const errFd = openSync(resolve(LOG_DIR, 'err.log'), 'a')

function writeLine(fd: number, label: string, args: unknown[]): void {
  // `formatWithOptions` is exactly how Node renders `console.*` args — printf
  // substitution, Error stacks and object inspection included.
  const line = `[${new Date().toISOString()}] ${label} ${formatWithOptions({ depth: 6, colors: false }, ...args)}\n`
  try {
    writeSync(fd, line)
  } catch {
    // Never let logging crash the app.
  }
}

/** The console methods we mirror, with the file and label each uses. */
const SINKS = [
  ['log', outFd, 'LOG'],
  ['info', outFd, 'INFO'],
  ['debug', outFd, 'DEBUG'],
  ['warn', errFd, 'WARN'],
  ['error', errFd, 'ERROR'],
] as const

/**
 * (Re)wraps `console.*` so every call also appends to the log files, chaining to
 * whatever `console` method is currently installed. Safe to call repeatedly —
 * OpenTUI replaces `console` with its overlay capture when the renderer is
 * created, so this must be called again *after* `createApp` to re-own it (while
 * still forwarding to OpenTUI's overlay).
 */
export function patchConsole(): void {
  const sink = console as unknown as Record<string, (...args: unknown[]) => void>
  for (const [method, fd, label] of SINKS) {
    const inner = sink[method].bind(console)
    sink[method] = (...args: unknown[]) => {
      writeLine(fd, label, args)
      inner(...args)
    }
  }
}

// Initialize on import so console + crash handlers are active before any other
// module's top-level code runs (this module is imported first in main.ts).
patchConsole()
process.on('uncaughtException', (err) => writeLine(errFd, 'uncaughtException', [err]))
process.on('unhandledRejection', (reason) => writeLine(errFd, 'unhandledRejection', [reason]))
writeLine(outFd, 'BOOT', [`logging to ${LOG_DIR}`])
