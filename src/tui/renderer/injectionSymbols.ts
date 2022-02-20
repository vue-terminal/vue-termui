import { InjectionKey, inject } from '@vue/runtime-core'
import { LogUpdate } from './LogUpdate'

export const logSymbol = Symbol('vue-termui:log') as InjectionKey<LogUpdate>

export function useLog() {
  // TODO: add globally to avoid inject problem
  return inject(logSymbol)!
}
