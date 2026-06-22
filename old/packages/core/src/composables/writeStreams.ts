import { inject, InjectionKey } from '@vue/runtime-core'

export interface UseStdoutReturn {
  stdout: NodeJS.WriteStream
  write: NodeJS.WriteStream['write']
}
export const stdoutSymbol = Symbol(
  'vue-termui:stdout'
) as InjectionKey<UseStdoutReturn>

export function useStdout() {
  return inject(stdoutSymbol)!
}
