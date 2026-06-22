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
import { inspect } from 'node:util'

const LOG_DIR = resolve(process.cwd(), 'logs')
mkdirSync(LOG_DIR, { recursive: true })

const outFd = openSync(resolve(LOG_DIR, 'out.log'), 'a')
const errFd = openSync(resolve(LOG_DIR, 'err.log'), 'a')

/** Serialize one console argument, keeping Error stacks intact. */
function format(arg: unknown): string {
  if (arg instanceof Error) return arg.stack ?? `${arg.name}: ${arg.message}`
  if (typeof arg === 'string') return arg
  return inspect(arg, { depth: 6, colors: false })
}

function writeLine(fd: number, label: string, args: unknown[]): void {
  const line = `[${new Date().toISOString()}] ${label} ${args.map(format).join(' ')}\n`
  try {
    writeSync(fd, line)
  } catch {
    // Never let logging crash the app.
  }
}

/**
 * Patches `console.*` to also append to the log files and routes uncaught
 * errors/rejections to `err.log`. Runs once on import (see bottom of file).
 */
export function setupFileLogging(): void {
  const original = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    debug: console.debug.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  }

  console.log = (...args: unknown[]) => (writeLine(outFd, 'LOG', args), original.log(...args))
  console.info = (...args: unknown[]) => (writeLine(outFd, 'INFO', args), original.info(...args))
  console.debug = (...args: unknown[]) => (writeLine(outFd, 'DEBUG', args), original.debug(...args))
  console.warn = (...args: unknown[]) => (writeLine(errFd, 'WARN', args), original.warn(...args))
  console.error = (...args: unknown[]) => (writeLine(errFd, 'ERROR', args), original.error(...args))

  process.on('uncaughtException', (err) => writeLine(errFd, 'uncaughtException', [err]))
  process.on('unhandledRejection', (reason) => writeLine(errFd, 'unhandledRejection', [reason]))

  writeLine(outFd, 'BOOT', [`logging to ${LOG_DIR}`])
}

// Initialize on import so this is active before any other module's top-level
// code runs (this module is imported first in main.ts).
setupFileLogging()
