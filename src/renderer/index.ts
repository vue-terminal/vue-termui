import {
  type BaseRenderable,
  type CliRenderer,
  CliRenderEvents,
  type CliRendererConfig,
  createCliRenderer,
  type Renderable,
} from '@opentui/core'
import {
  type App as BaseApp,
  type Component,
  createRenderer,
  inject,
  type InjectionKey,
} from '@vue/runtime-core'
import { createNodeOps } from './nodeOps'

export { createNodeOps } from './nodeOps'
export type { TuiElementTag } from './nodeOps'

/**
 * Injection key for the OpenTUI {@link CliRenderer} the app is mounted onto.
 * {@link createTuiApp} provides it on the app so components can reach the
 * renderer via {@link useRenderer}.
 */
export const rendererInjectionKey: InjectionKey<CliRenderer> = Symbol('vue-termui:renderer')

/**
 * Returns the OpenTUI {@link CliRenderer} the current component tree is mounted
 * onto. Must be called from within a component set up by a vue-termui app.
 */
export function useRenderer(): CliRenderer {
  const renderer = inject(rendererInjectionKey)
  if (!renderer) {
    throw new Error('[vue-termui] useRenderer() must be called within a vue-termui app.')
  }
  return renderer
}

/**
 * The app returned by {@link createApp} and {@link createTuiApp}. It extends
 * Vue's {@link BaseApp} with a `mount` method that defaults to the renderer root
 * and unmounts the app when the renderer is destroyed.
 */
export interface App<T> extends Omit<BaseApp<T>, 'mount'> {
  mount(rootContainer?: Renderable): ReturnType<BaseApp<T>['mount']>
}

/**
 * Wires a Vue custom renderer onto an existing OpenTUI {@link CliRenderer} and
 * provides the renderer on the app. The returned app is **not** mounted yet —
 * call `app.mount()` (defaults to the renderer root) once plugins are installed.
 *
 * `app.mount()` also unmounts the app when the renderer is destroyed: OpenTUI
 * emits `destroy` before it tears down its native text buffers, so unmounting
 * here stops Vue's reactivity (and runs `onUnmounted`, e.g. to clear timers)
 * before a pending component update could patch an already-destroyed buffer.
 *
 * @param renderer - the OpenTUI renderer to mount into
 * @param rootComponent - the Vue root component to mount
 * @param rootProps - props passed to the root component
 */
export function createTuiApp(
  renderer: CliRenderer,
  rootComponent: Component,
  rootProps?: Record<string, unknown> | null,
): App<Renderable> {
  const { createApp: baseCreateApp } = createRenderer<BaseRenderable, Renderable>(
    createNodeOps(renderer),
  )
  const app = baseCreateApp(rootComponent, rootProps ?? null)
  app.provide(rendererInjectionKey, renderer)

  // Mount into the renderer root by default so `app.mount()` needs no argument,
  // and tie the app's lifetime to the renderer's.
  const { mount } = app
  app.mount = (rootContainer = renderer.root) => {
    const instance = mount(rootContainer)
    renderer.once(CliRenderEvents.DESTROY, () => {
      app.unmount()
      // In dev, `vue-termui/vite` registers a teardown so the first Ctrl+C also
      // stops the Vite dev server and exits the process; without it Vite's open
      // handles keep the process alive and a second Ctrl+C would be needed. The
      // global is unset in production/tests, so this is a no-op there.
      ;(globalThis as { __VUE_TERMUI_TEARDOWN__?: () => void }).__VUE_TERMUI_TEARDOWN__?.()
    })
    return instance
  }

  return app as App<Renderable>
}

/**
 * Creates an OpenTUI renderer and wires a Vue custom renderer onto it, mirroring
 * Vue's own `createApp`: it returns the {@link BaseApp} **without mounting it**, so
 * callers can install plugins (`app.use(...)`) and `await` async readiness
 * (e.g. `router.isReady()`) before calling `app.mount()`.
 *
 * The renderer is provided on the app internally — reach it from components with
 * {@link useRenderer}. `app.mount()` defaults to the renderer root, so it needs
 * no argument.
 *
 * @param rootComponent - the Vue root component to mount
 * @param rootProps - props passed to the root component
 * @param rendererConfig - options forwarded to `createCliRenderer`
 */
export async function createApp(
  rootComponent: Component,
  rootProps?: Record<string, unknown> | null,
  rendererConfig?: CliRendererConfig,
): Promise<App<Renderable>> {
  const renderer = await createCliRenderer(rendererConfig)
  return createTuiApp(renderer, rootComponent, rootProps)
}
