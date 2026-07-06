// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  createServer,
  isRunnableDevEnvironment,
  type Logger,
  type Plugin,
  type ViteDevServer,
} from 'vite'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { vueTermui } from './vite'
import { mockConsoleError } from './__tests__/mock-console'

/**
 * The dev server runs the app in the runnable `ssr` environment with the browser
 * HMR socket off, so `@vitejs/plugin-vue`'s `file-changed` custom event (which
 * decides rerender-vs-reload) must be bridged onto the `ssr` hot channel. These
 * tests assert web parity: editing only the template hot-swaps the render
 * function (`rerender`, state preserved), editing the script reloads.
 */
describe('vueTermui dev HMR', () => {
  let server: ViteDevServer | undefined
  let root: string | undefined

  afterEach(async () => {
    await server?.close()
    server = undefined
    if (root) rmSync(root, { recursive: true, force: true })
    root = undefined
  })

  const sfc = (label: string, initial: number) => `<script setup>
import { ref } from 'vue'
const n = ref(${initial})
</script>
<template><box><text>${label} {{ n }}</text></box></template>
`

  /**
   * Loads a component through the `ssr` runner, edits its file, drives the
   * watcher, and resolves with whichever HMR path Vue takes (`rerender` or
   * `reload`). Resolving from the patched runtime hooks keeps the test
   * deterministic instead of polling on a timer.
   */
  async function hmrPathFor(next: string): Promise<'rerender' | 'reload'> {
    // A temp project inside the repo so the fixture's bare `vue` import resolves
    // through the repo's own `node_modules`.
    root = mkdtempSync(join(process.cwd(), '.vt-hmr-'))
    const file = join(root, 'Comp.vue')
    writeFileSync(file, sfc('A', 0))

    server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      // The fixture has no real entry, so skip dep discovery (which would scan
      // the plugin's `rolldownOptions.input`); it is irrelevant to HMR routing.
      optimizeDeps: { noDiscovery: true },
      plugins: [vueTermui({ autoLaunch: false })],
    })
    await server.listen(0)

    const ssr = server.environments.ssr
    if (!isRunnableDevEnvironment(ssr)) throw new Error('ssr environment is not runnable')
    await ssr.runner.import('/Comp.vue')

    const hmr = (globalThis as { __VUE_HMR_RUNTIME__?: Record<string, unknown> })
      .__VUE_HMR_RUNTIME__
    expect(hmr, 'Vue HMR runtime should be registered by the dev build').toBeTruthy()

    const path = new Promise<'rerender' | 'reload'>((resolve) => {
      for (const name of ['rerender', 'reload'] as const) {
        const orig = hmr![name] as (...a: unknown[]) => unknown
        hmr![name] = (...a: unknown[]) => {
          resolve(name)
          return orig.apply(hmr, a)
        }
      }
    })

    writeFileSync(file, next)
    server.watcher.emit('change', file)

    return path
  }

  it('rerenders (keeps state) when only the template changed', async () => {
    // Same script, different template text.
    await expect(hmrPathFor(sfc('B', 0))).resolves.toBe('rerender')
  })

  it('reloads (resets state) when the script changed', async () => {
    // Different script (initial ref value) forces a full reload.
    await expect(hmrPathFor(sfc('A', 42))).resolves.toBe('reload')
  })
})

/**
 * These assert the static plugin contract a user sees: which plugins are
 * returned, the build/dev config each contributes, the bundle `external`
 * predicate, and the `isCustomElement` merge. They need no server, so they run
 * synchronously — the config hooks are plain functions we call directly.
 */
describe('vueTermui plugin config', () => {
  /** The `vue-termui:config` plugin's resolved `config()` return. */
  function baseConfig(options?: Parameters<typeof vueTermui>[0]) {
    const plugin = vueTermui(options).find((p) => p.name === 'vue-termui:config')
    const hook = plugin?.config as ((...a: unknown[]) => Record<string, any>) | undefined
    if (!hook) throw new Error('vue-termui:config plugin has no config() hook')
    return hook.call(plugin, {}, { command: 'build', mode: 'production' })
  }

  /** The merged `isCustomElement`, read off the wrapped `@vitejs/plugin-vue`. */
  function isCustomElement(options?: Parameters<typeof vueTermui>[0]): (tag: string) => boolean {
    const vuePlugin = vueTermui(options).at(-1) as Plugin & {
      api?: { options?: { template?: { compilerOptions?: { isCustomElement?: unknown } } } }
    }
    const fn = vuePlugin.api?.options?.template?.compilerOptions?.isCustomElement
    if (typeof fn !== 'function') throw new Error('isCustomElement was not installed on plugin-vue')
    return fn as (tag: string) => boolean
  }

  it('returns the config, dev, and vue plugins in that order', () => {
    expect(vueTermui().map((p) => p.name)).toEqual([
      'vue-termui:config',
      'vue-termui:dev',
      'vite:vue',
    ])
  })

  it('keeps @opentui/core out of dep optimization in both environments', () => {
    const config = baseConfig()
    expect(config.optimizeDeps.exclude).toContain('@opentui/core')
    expect(config.ssr.optimizeDeps.exclude).toContain('@opentui/core')
  })

  it('configures a Node-friendly build (esnext, no module preload, single entry)', () => {
    const { build } = baseConfig()
    expect(build.target).toBe('esnext')
    expect(build.modulePreload).toBe(false)
    expect(build.rolldownOptions.input).toBe('src/main.ts')
    expect(build.rolldownOptions.output.entryFileNames).toBe('[name].js')
  })

  // `env -S` splits the line into words; without it, Linux passes
  // "node --experimental-ffi …" to `env` as a single argument.
  it('prepends a shebang so the entry works as a package.json bin', () => {
    const { build } = baseConfig()
    expect(build.rolldownOptions.output.banner).toBe(
      '#!/usr/bin/env -S node --experimental-ffi --disable-warning=ExperimentalWarning',
    )
  })

  // The bundle is self-contained: every dep is inlined, and only what cannot
  // be bundled stays external — Node builtins and the native `@opentui/core`.
  it.each([
    ['vue', false],
    ['vue-router', false],
    ['@opentui/core', true],
    ['@opentui/core/sub-path', true],
    ['node:fs', true],
    ['fs', true],
    ['fs/promises', true],
    ['vue-router/auto-routes', false],
    ['\0some-virtual', false],
    ['virtual:generated', false],
    ['./relative', false],
    ['../up-one', false],
    ['/src/main.ts', false],
  ])('external(%j) === %s', (id, expected) => {
    const external = baseConfig().build.rolldownOptions.external as (id: string) => boolean
    expect(external(id)).toBe(expected)
  })

  it('registers the host tags as custom elements', () => {
    const isCE = isCustomElement()
    for (const tag of ['box', 'text', 'input', 'textarea', 'select']) {
      expect(isCE(tag), tag).toBe(true)
    }
    expect(isCE('div')).toBe(false)
    expect(isCE('MyComponent')).toBe(false)
  })

  it('merges a user isCustomElement on top of the host tags', () => {
    const isCE = isCustomElement({
      vue: { template: { compilerOptions: { isCustomElement: (tag) => tag === 'my-widget' } } },
    })
    expect(isCE('my-widget')).toBe(true) // user tag
    expect(isCE('box')).toBe(true) // host tag still wins
    expect(isCE('div')).toBe(false) // neither
  })

  it('serves dev config that yields the screen and disables the browser socket', () => {
    const dev = vueTermui().find((p) => p.name === 'vue-termui:dev')
    expect(dev?.apply).toBe('serve')
    const hook = dev?.config as (...a: unknown[]) => Record<string, unknown>
    expect(hook.call(dev, {}, { command: 'serve', mode: 'development' })).toEqual({
      clearScreen: false,
      logLevel: 'error',
      server: { ws: false },
    })
  })
})

/**
 * End-to-end coverage of the dev server side effects: it flags the in-process
 * app as dev, launches the entry through the runnable `ssr` runner, installs a
 * teardown that closes the server and exits, and surfaces a failing entry via
 * the logger. Driven through a real Vite server for parity with `vite`.
 */
describe('vueTermui dev launch', () => {
  mockConsoleError()

  let server: ViteDevServer | undefined
  let root: string | undefined
  let seq = 0

  afterEach(async () => {
    vi.restoreAllMocks()
    await server?.close()
    server = undefined
    if (root) rmSync(root, { recursive: true, force: true })
    root = undefined
    delete (globalThis as Record<string, unknown>).__VUE_TERMUI_DEV__
    delete (globalThis as Record<string, unknown>).__VUE_TERMUI_TEARDOWN__
  })

  /** Poll a predicate instead of guessing at a timeout for the async launch. */
  async function waitFor(predicate: () => boolean, attempts = 300): Promise<void> {
    for (let i = 0; i < attempts; i++) {
      if (predicate()) return
      // Sequential by design: this is a poll, each tick depends on the last.
      // eslint-disable-next-line no-await-in-loop
      await new Promise((resolve) => setTimeout(resolve, 10))
    }
    throw new Error('waitFor: condition was never met')
  }

  /** Boots a dev server against a one-file temp project and awaits `listen`. */
  async function startDev(opts: {
    entry?: string
    autoLaunch?: boolean
    entrySource?: string
    logger?: Logger
  }): Promise<void> {
    root = mkdtempSync(join(process.cwd(), '.vt-launch-'))
    if (opts.entry && opts.entrySource != null) {
      writeFileSync(join(root, opts.entry.replace(/^\//, '')), opts.entrySource)
    }
    server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      customLogger: opts.logger,
      // No real entry graph to discover; skip the scan for a faster boot.
      optimizeDeps: { noDiscovery: true },
      plugins: [vueTermui({ entry: opts.entry, autoLaunch: opts.autoLaunch })],
    })
    await server.listen(0)
  }

  const captureErrors = (): { logger: Logger; errors: string[] } => {
    const errors: string[] = []
    const logger: Logger = {
      info() {},
      warn() {},
      warnOnce() {},
      error(msg) {
        errors.push(String(msg))
      },
      clearScreen() {},
      hasErrorLogged: () => false,
      hasWarned: false,
    }
    return { logger, errors }
  }

  it('flags the in-process app as running under the dev server', async () => {
    await startDev({ entry: '/entry.ts', autoLaunch: false, entrySource: '' })
    expect((globalThis as Record<string, unknown>).__VUE_TERMUI_DEV__).toBe(true)
    // No teardown is installed when auto-launch is off.
    expect((globalThis as Record<string, unknown>).__VUE_TERMUI_TEARDOWN__).toBeUndefined()
  })

  it('imports the entry through the ssr runner when autoLaunch is on', async () => {
    const key = `__VT_LAUNCHED_${seq++}`
    await startDev({
      entry: '/entry.ts',
      autoLaunch: true,
      entrySource: `;(globalThis)[${JSON.stringify(key)}] = ((globalThis)[${JSON.stringify(
        key,
      )}] || 0) + 1`,
    })
    await waitFor(() => (globalThis as Record<string, unknown>)[key] === 1)
    expect((globalThis as Record<string, unknown>)[key]).toBe(1)
    expect((globalThis as Record<string, unknown>).__VUE_TERMUI_TEARDOWN__).toBeTypeOf('function')
    delete (globalThis as Record<string, unknown>)[key]
  })

  it('installs a teardown that closes the server and exits the process', async () => {
    await startDev({ entry: '/entry.ts', autoLaunch: true, entrySource: '' })
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => undefined) as never)
    const close = vi.spyOn(server!, 'close')
    const teardown = (globalThis as { __VUE_TERMUI_TEARDOWN__?: () => void })
      .__VUE_TERMUI_TEARDOWN__
    expect(teardown).toBeTypeOf('function')

    teardown!()
    await waitFor(() => exit.mock.calls.length > 0)
    expect(close).toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(0)

    // Let the aborted launch import reject while `console.error` is still
    // mocked, so a regression logging it as a launch failure fails the test.
    await new Promise((resolve) => setTimeout(resolve, 50))
  })

  it('logs an error when the entry fails to launch', async () => {
    const { logger, errors } = captureErrors()
    await startDev({
      entry: '/boom.ts',
      autoLaunch: true,
      entrySource: `throw new Error('kaboom')`,
      logger,
    })
    await waitFor(() => errors.some((e) => e.includes('failed to launch /boom.ts')))
    expect(errors.some((e) => e.includes('[vue-termui] failed to launch /boom.ts'))).toBe(true)
    expect('kaboom').toHaveBeenErrored()
  })
})
