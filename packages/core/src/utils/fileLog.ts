import { getCurrentScope, onScopeDispose } from '@vue/runtime-core'
import { createWriteStream } from 'node:fs'

export function useDebugLog(file = `debug-${Date.now()}.log`) {
  const stream = createWriteStream(file, { flags: 'a' })

  if (getCurrentScope())
    onScopeDispose(() => {
      stream.end()
    })

  function write(...args: any[]) {
    stream.write(
      `${new Date().toISOString()}: ${
        'toString' in args ? args.toString() : String(args)
      }\n`
    )
  }

  return write
}
