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
  shallowRef,
} from '@vue/runtime-core'
import { createNodeOps } from './nodeOps'
import { USE_CURRENT_FOCUSED_ELEMENT_KEY } from '../composables/focus'
import { subscribeRendererEvent } from '../composables/useRendererEvent'

export { createNodeOps } from './nodeOps'
export type { TuiElementTag } from './nodeOps'

declare global {
  /**
   * Location pushed to the router when the app starts. Read it in your entry
   * (`router.push(VUE_TERMUI_START_LOCATION)`) so navigation survives dev full
   * reloads: it is seeded from the `VUE_TERMUI_START_LOCATION` env var (or `/`),
   * then overwritten with the current route before each reload (see the capture
   * in {@link createTuiApp}).
   */
  // eslint-disable-next-line no-var
  var VUE_TERMUI_START_LOCATION: string
}

// Seed once per process. The library is externalized to native Node (see the dev
// full-reload bridge below), so this module evaluates a single time and the value
// persists across reloads — the env var sets the very first screen, `/` otherwise.
globalThis.VUE_TERMUI_START_LOCATION ??= process.env.VUE_TERMUI_START_LOCATION || '/'

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
 * Injection key for the app's exit function. Provided by {@link createTuiApp};
 * read it with {@link useExit}.
 */
export const exitInjectionKey: InjectionKey<() => void> = Symbol('vue-termui:exit')

/**
 * Returns a function that exits the app — tears down the OpenTUI renderer,
 * restoring the terminal (cursor, screen buffer, raw mode). Equivalent to
 * `app.exit()`, but callable from inside a component.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { onKeyDown, useExit } from 'vue-termui'
 * const exit = useExit()
 * onKeyDown((key) => key.name === 'q' && exit())
 * </script>
 * ```
 */
export function useExit(): () => void {
  const exit = inject(exitInjectionKey)
  if (!exit) {
    throw new Error('[vue-termui] useExit() must be called within a vue-termui app.')
  }
  return exit
}

/**
 * The app returned by {@link createApp} and {@link createTuiApp}. It extends
 * Vue's {@link BaseApp} with a `mount` method that defaults to the renderer root
 * and unmounts the app when the renderer is destroyed.
 */
export interface App<T> extends Omit<BaseApp<T>, 'mount'> {
  mount(rootContainer?: Renderable): ReturnType<BaseApp<T>['mount']>

  /**
   * Resolves when the app exits — i.e. when the OpenTUI renderer is destroyed
   * (Ctrl+C, an exit signal, {@link App.exit} or `renderer.destroy()`). Useful
   * to keep a launcher process alive until the user quits:
   *
   * ```ts
   * const app = await createApp(App)
   * app.mount()
   * await app.waitUntilExit()
   * ```
   */
  waitUntilExit(): Promise<void>

  /**
   * Exits the app: destroys the renderer (restoring the terminal) and resolves
   * {@link App.waitUntilExit}. Idempotent.
   */
  exit(): void
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

  // useRenderer()
  app.provide(rendererInjectionKey, renderer)

  // deduped useCurrentFocusedElement()
  const currentFocusedElement = shallowRef<Renderable | null>(null)
  app.provide(USE_CURRENT_FOCUSED_ELEMENT_KEY, currentFocusedElement)
  subscribeRendererEvent(renderer, CliRenderEvents.FOCUSED_RENDERABLE, () => {
    currentFocusedElement.value = renderer.currentFocusedRenderable
  })

  // Dev full-reload bridge. On an edit with no HMR boundary (the entry, the
  // router, a plain `.ts` module), Vite's module runner clears its cache and
  // re-imports the entry — so `createApp` runs again and would mount a *second*
  // app while this one still owns the terminal. Expose this renderer's teardown
  // on a global so the next `createApp` can dispose the previous app before it
  // creates the new renderer. The library is externalized to native Node but
  // shares the runner's `globalThis`, so a plain global is the bridge (same
  // pattern as `__VUE_TERMUI_DEV__`/`__VUE_TERMUI_TEARDOWN__`). Unset outside dev,
  // so this is a no-op in production and tests.
  if ((globalThis as { __VUE_TERMUI_DEV__?: boolean }).__VUE_TERMUI_DEV__) {
    ;(globalThis as { __VUE_TERMUI_DEV_DESTROY__?: () => void }).__VUE_TERMUI_DEV_DESTROY__ =
      () => {
        // Stash the current route before tearing down so the re-imported entry can
        // push it back and land on the same screen. `$router` is set by vue-router
        // on install (long before teardown); read it structurally so the library
        // keeps no dependency on vue-router. It is absent when no router is installed
        // and may be some other plugin's `$router`, so optional-chain the whole path
        // and only accept an actual string.
        const router = app.config.globalProperties.$router as
          | { currentRoute?: { value?: { fullPath?: string } } }
          | undefined
        const location = router?.currentRoute?.value?.fullPath
        if (typeof location === 'string') globalThis.VUE_TERMUI_START_LOCATION = location
        renderer.destroy()
      }
  }

  // `waitUntilExit()` resolves when the renderer is destroyed (Ctrl+C, an exit
  // signal, `exit()` or a direct `renderer.destroy()`). The promise is created
  // eagerly so it can be awaited before `mount()`; `once` guarantees a single
  // resolution even if `destroy` somehow fired twice.
  let resolveExit: () => void
  const exitPromise = new Promise<void>((resolve) => {
    resolveExit = resolve
  })
  renderer.once(CliRenderEvents.DESTROY, () => resolveExit())

  // Exiting is just tearing down the renderer; OpenTUI restores the terminal and
  // emits `destroy`, which resolves `exitPromise` and unmounts the Vue app
  // (see `mount` below). `destroy()` is itself idempotent.
  const exit = (): void => renderer.destroy()
  app.provide(exitInjectionKey, exit)

  // Surface errors in OpenTUI's console overlay instead of crashing the terminal
  // app. `createCliRenderer` defaults to `consoleMode: 'console-overlay'`, so
  // `console.*` output is captured and viewable (toggle with the console
  // keybinding); we also open the overlay automatically so failures are visible:
  //
  // Component (runtime) errors — a throw in render/setup/a lifecycle hook/an
  // event handler — are routed to the overlay and swallowed, so one bad
  // component can't tear down the whole app. This is a *default*: apps may
  // reassign `app.config.errorHandler` (e.g. to report elsewhere) and theirs wins.
  app.config.errorHandler = (err, _instance, info) => {
    console.error(`[vue-termui] Unhandled error while ${info}:`, err)
    renderer.console.show()
  }

  // In dev, Vite's module runner logs compilation errors (e.g. a template syntax
  // error caught during HMR) via `console.error`. OpenTUI already captures it;
  // wrapping `console.error` also pops the overlay open so compile failures are
  // as visible as runtime ones. Restored on renderer destroy (see below). The
  // `__VUE_TERMUI_DEV__` flag is set by `vue-termui/vite`, so this is a no-op in
  // production and tests, where popping a debug overlay on every error log would
  // be surprising.
  let restoreConsoleError: (() => void) | undefined
  if ((globalThis as { __VUE_TERMUI_DEV__?: boolean }).__VUE_TERMUI_DEV__) {
    const original = console.error
    console.error = (...args: unknown[]) => {
      ;(original as (...a: unknown[]) => void)(...args)
      renderer.console.show()
    }
    restoreConsoleError = () => {
      console.error = original
    }
  }

  // Mount into the renderer root by default so `app.mount()` needs no argument,
  // and tie the app's lifetime to the renderer's.
  const { mount } = app
  app.mount = (rootContainer = renderer.root) => {
    const instance = mount(rootContainer)
    renderer.once(CliRenderEvents.DESTROY, () => {
      app.unmount()
      restoreConsoleError?.()
      // In dev, `vue-termui/vite` registers a teardown so the first Ctrl+C also
      // stops the Vite dev server and exits the process; without it Vite's open
      // handles keep the process alive and a second Ctrl+C would be needed. The
      // global is unset in production/tests, so this is a no-op there.
      ;(globalThis as { __VUE_TERMUI_TEARDOWN__?: () => void }).__VUE_TERMUI_TEARDOWN__?.()
    })
    return instance
  }

  const tuiApp = app as App<Renderable>
  tuiApp.waitUntilExit = () => exitPromise
  tuiApp.exit = exit
  return tuiApp
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
 * @param rendererOptions - options forwarded to `createCliRenderer`
 */
export async function createApp(
  rootComponent: Component,
  rootProps?: Record<string, unknown> | null,
  rendererOptions?: CliRendererConfig,
): Promise<App<Renderable>> {
  disposePreviousDevApp()
  const renderer = await createCliRenderer({
    ...rendererOptions,
    // catch logs that could break rendering
    consoleMode: rendererOptions?.consoleMode ?? 'console-overlay',
    // this gets inlined when bundling for prod and avoids showing the debug console in prod
    openConsoleOnError:
      rendererOptions?.openConsoleOnError ?? process.env.NODE_ENV !== 'production',
  })
  return createTuiApp(renderer, rootComponent, rootProps)
}

/**
 * Dev full reload: the module runner re-imports the entry on an edit with no HMR
 * boundary (the entry, the router, a plain `.ts` module), landing back in
 * {@link createApp}. Dispose the previously mounted app first so its renderer
 * releases the terminal and its `onUnmounted` hooks run (clearing timers) —
 * otherwise the old and new renderers fight over the TTY.
 *
 * The previous app's `DESTROY` hook also runs the dev teardown (which closes the
 * Vite server and exits the process), so suppress that for the disposal: a reload
 * must not exit. `destroy()` emits `DESTROY` synchronously, so nulling the
 * teardown around the call reliably covers the hook, then restores it for the
 * next app's eventual Ctrl+C.
 *
 * No-op outside dev and on first launch — the disposer is only registered by
 * {@link createTuiApp} once an app exists under the dev server. Only the
 * {@link createApp} path is covered; apps that bring their own renderer to
 * {@link createTuiApp} own this lifecycle themselves.
 */
export function disposePreviousDevApp(): void {
  const dev = globalThis as {
    __VUE_TERMUI_DEV_DESTROY__?: () => void
    __VUE_TERMUI_TEARDOWN__?: () => void
  }
  if (!dev.__VUE_TERMUI_DEV_DESTROY__) return
  const teardown = dev.__VUE_TERMUI_TEARDOWN__
  dev.__VUE_TERMUI_TEARDOWN__ = undefined
  dev.__VUE_TERMUI_DEV_DESTROY__()
  dev.__VUE_TERMUI_TEARDOWN__ = teardown
}
