import { InjectionKey, inject } from '@vue/runtime-core'
import { DOMElement } from './renderer/dom'
import { LogUpdate } from './renderer/LogUpdate'

export const logSymbol = Symbol('vue-termui:log') as InjectionKey<LogUpdate>

export function useLog() {
  // TODO: add globally to avoid inject problem
  return inject(logSymbol)!
}

export const rootNodeSymbol = Symbol(
  'vue-termui:root-node'
) as InjectionKey<DOMElement>
export function useRootNode() {
  return inject(rootNodeSymbol)!
}

export const stdoutSymbol = Symbol(
  'vue-termui:stdout'
) as InjectionKey<NodeJS.WriteStream>
export function useStdout() {
  return inject(stdoutSymbol)!
}

export const scheduleUpdateSymbol = Symbol(
  'vue-termui:scheduleUpdate'
) as InjectionKey<() => void>

export const renderOnceSymbol = Symbol(
  'vue-termui:render-once'
) as InjectionKey<boolean>
