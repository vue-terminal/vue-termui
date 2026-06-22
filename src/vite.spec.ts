// @vitest-environment node
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { createServer, isRunnableDevEnvironment, type ViteDevServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
import { vueTermui } from './vite'

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
