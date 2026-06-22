export const version = '0.0.0'

// Re-export the Vue runtime so apps import `h`, `defineComponent`, `ref`, etc.
// from a single runtime-core instance — the same one this custom renderer is
// built on. Importing these from `vue` instead would load a second copy of
// runtime-core and break vnode/instance interop.
export * from '@vue/runtime-core'

export { useHello } from './useHello'

export { createApp, createNodeOps } from './renderer/index'
export type { CreateAppResult, TuiElementTag } from './renderer/index'
