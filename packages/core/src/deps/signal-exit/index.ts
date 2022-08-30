// @ts-nocheck
import assert from 'node:assert'
import EE from 'node:events'
import allSignals, { Signal } from './signals'
export type { Signal } from './signals'

let signals = allSignals

const hasProcess = typeof process !== 'undefined'

const processOk = function (process: NodeJS.Process) {
  return (
    hasProcess &&
    process &&
    typeof process === 'object' &&
    typeof process.removeListener === 'function' &&
    typeof process.emit === 'function' &&
    // typeof process.reallyExit === 'function' &&
    typeof process.listeners === 'function' &&
    typeof process.kill === 'function' &&
    typeof process.pid === 'number' &&
    typeof process.on === 'function'
  )
}

// some kind of non-node environment, just no-op
/* istanbul ignore if */
var isWin = hasProcess && /^win/i.test(process.platform)

var emitter
if (hasProcess) {
  if (process.__signal_exit_emitter__) {
    emitter = process.__signal_exit_emitter__
  } else {
    emitter = process.__signal_exit_emitter__ = new EE()
    emitter.count = 0
    emitter.emitted = {}
  }
}

// Because this emitter is a global, we have to check to see if a
// previous version of this library failed to enable infinite listeners.
// I know what you're about to say.  But literally everything about
// signal-exit is a compromise with evil.  Get used to it.
if (emitter && !emitter.infinite) {
  emitter.setMaxListeners(Infinity)
  emitter.infinite = true
}

export interface Options {
  alwaysLast?: boolean
}

export function onExit(
  cb: (code: number | null, signal: Signal | null) => void,
  opts?: Options
): () => void {
  /* istanbul ignore if */
  if (!processOk(global.process)) {
    return function () { }
  }
  assert.equal(
    typeof cb,
    'function',
    'a callback must be provided for exit handler'
  )

  if (loaded === false) {
    load()
  }

  var ev = 'exit'
  if (opts && opts.alwaysLast) {
    ev = 'afterexit'
  }

  var remove = function () {
    emitter.removeListener(ev, cb)
    if (
      emitter.listeners('exit').length === 0 &&
      emitter.listeners('afterexit').length === 0
    ) {
      unload()
    }
  }
  emitter.on(ev, cb)

  return remove
}

export var unload = function unload() {
  if (!loaded || !processOk(global.process)) {
    return
  }
  loaded = false

  signals.forEach(function (sig) {
    try {
      process.removeListener(sig, sigListeners[sig])
    } catch (er) { }
  })
  process.emit = originalProcessEmit
  process.reallyExit = originalProcessReallyExit
  emitter.count -= 1
}

var emit = function emit(event, code, signal) {
  /* istanbul ignore if */
  if (emitter.emitted[event]) {
    return
  }
  emitter.emitted[event] = true
  emitter.emit(event, code, signal)
}

// { <signal>: <listener fn>, ... }
var sigListeners = {}
signals.forEach(function (sig) {
  sigListeners[sig] = function listener() {
    /* istanbul ignore if */
    if (!processOk(global.process)) {
      return
    }
    // If there are no other listeners, an exit is coming!
    // Simplest way: remove us and then re-send the signal.
    // We know that this will kill the process, so we can
    // safely emit now.
    var listeners = process.listeners(sig)
    if (listeners.length === emitter.count) {
      unload()
      emit('exit', null, sig)
      /* istanbul ignore next */
      emit('afterexit', null, sig)
      /* istanbul ignore next */
      if (isWin && sig === 'SIGHUP') {
        // "SIGHUP" throws an `ENOSYS` error on Windows,
        // so use a supported signal instead
        sig = 'SIGINT'
      }
      /* istanbul ignore next */
      process.kill(process.pid, sig)
    }
  }
})

export { signals }

var loaded = false

var load = function load() {
  if (loaded || !processOk(global.process)) {
    return
  }
  loaded = true

  // This is the number of onSignalExit's that are in play.
  // It's important so that we can count the correct number of
  // listeners on signals, and don't wait for the other one to
  // handle it instead of us.
  emitter.count += 1

  signals = signals.filter(function (sig) {
    try {
      process.on(sig, sigListeners[sig])
      return true
    } catch (er) {
      return false
    }
  })

  process.emit = processEmit
  process.reallyExit = processReallyExit
}

export { load }

var originalProcessReallyExit = hasProcess ? process.reallyExit : () => { }
var processReallyExit = function processReallyExit(code) {
  /* istanbul ignore if */
  if (!processOk(global.process)) {
    return
  }
  process.exitCode = code || /* istanbul ignore next */ 0
  emit('exit', process.exitCode, null)
  /* istanbul ignore next */
  emit('afterexit', process.exitCode, null)
  /* istanbul ignore next */
  originalProcessReallyExit.call(process, process.exitCode)
}

var originalProcessEmit = hasProcess ? process.emit : () => { }
var processEmit = function processEmit(ev, arg) {
  if (ev === 'exit' && processOk(global.process)) {
    /* istanbul ignore else */
    if (arg !== undefined) {
      process.exitCode = arg
    }
    var ret = originalProcessEmit.apply(this, arguments)
    /* istanbul ignore next */
    emit('exit', process.exitCode, null)
    /* istanbul ignore next */
    emit('afterexit', process.exitCode, null)
    /* istanbul ignore next */
    return ret
  } else {
    return originalProcessEmit.apply(this, arguments)
  }
}
