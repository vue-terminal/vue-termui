import {
  type BaseRenderable,
  type CliRenderer,
  CliRenderEvents,
  type CliRendererConfig,
  createCliRenderer,
  type Renderable,
} from '@opentui/core'
import { type App, type Component, createRenderer } from '@vue/runtime-core'
import { createNodeOps } from './nodeOps'

export { createNodeOps } from './nodeOps'
export type { TuiElementTag } from './nodeOps'

/**
 * Result of {@link createApp}: the mounted Vue {@link App} plus the underlying
 * OpenTUI {@link CliRenderer}.
 */
export interface CreateAppResult {
  app: App<Renderable>
  renderer: CliRenderer
}

/**
 * Wires a Vue custom renderer onto an existing OpenTUI {@link CliRenderer} and
 * mounts `rootComponent` into its root.
 *
 * The app is unmounted when the renderer is destroyed: OpenTUI emits `destroy`
 * before it tears down its native text buffers, so unmounting here stops Vue's
 * reactivity (and runs `onUnmounted`, e.g. to clear timers) before a pending
 * component update could patch an already-destroyed buffer.
 *
 * @param renderer - the OpenTUI renderer to mount into
 * @param rootComponent - the Vue root component to mount
 * @param rootProps - props passed to the root component
 */
export function mountApp(
  renderer: CliRenderer,
  rootComponent: Component,
  rootProps?: Record<string, unknown> | null,
): App<Renderable> {
  const { createApp: baseCreateApp } = createRenderer<BaseRenderable, Renderable>(
    createNodeOps(renderer),
  )
  const app = baseCreateApp(rootComponent, rootProps ?? null)
  app.mount(renderer.root)

  renderer.once(CliRenderEvents.DESTROY, () => {
    app.unmount()
  })

  return app
}

/**
 * Creates an OpenTUI renderer, wires a Vue custom renderer onto it, and mounts
 * `rootComponent` into the renderer's root.
 *
 * This is the minimal Phase 1 wiring; the full lifecycle (`waitUntilExit`,
 * `unmount`, mount options) is layered on later.
 *
 * @param rootComponent - the Vue root component to mount
 * @param rootProps - props passed to the root component
 * @param rendererConfig - options forwarded to `createCliRenderer`
 */
export async function createApp(
  rootComponent: Component,
  rootProps?: Record<string, unknown> | null,
  rendererConfig?: CliRendererConfig,
): Promise<CreateAppResult> {
  const renderer = await createCliRenderer(rendererConfig)
  const app = mountApp(renderer, rootComponent, rootProps)
  return { app, renderer }
}
