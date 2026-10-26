import { pathToFileURL } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import VueRouter from 'vue-router/vite'
import vueTermui from 'vue-termui/vite'

/**
 * `@kmamal/sdl` (the gamepad source of the rapier-car demo) loads a prebuilt
 * `.node` addon, so it cannot be bundled. Same treatment vue-termui's vite
 * plugin gives `bun-webgpu`: resolve it at build time and hand rolldown the
 * absolute file URL, because under pnpm's isolated node_modules a bare external
 * would not be resolvable from `dist/`. In dev the module runner already imports
 * it natively.
 */
function externalizeSdl(): Plugin {
  return {
    name: 'playground:externalize-sdl',
    apply: 'build',
    enforce: 'pre',
    async resolveId(id, importer, options) {
      if (id !== '@kmamal/sdl') return
      const resolved = await this.resolve(id, importer, { ...options, skipSelf: true })
      if (!resolved) return
      return { id: pathToFileURL(resolved.id).href, external: true }
    },
  }
}

export default defineConfig({
  plugins: [
    externalizeSdl(),
    // ⚠️ VueRouter() must come before the Vue SFC plugin (provided by
    // vueTermui()). File-based routes live in src/pages; demos under
    // src/pages/demos map to /demos/*.
    VueRouter({
      routesFolder: 'src/pages',
      // A demo that needs several components keeps them in its own folder
      // (src/pages/demos/<demo>/components); they are not pages.
      exclude: ['**/components/**'],
      // A terminal app needs all routes in the single CLI bundle anyway, so
      // import pages synchronously. This also avoids dynamic `import()`, which
      // Vite wraps in a browser-only `__vitePreload` helper.
      importMode: 'sync',
      dts: 'typed-router.d.ts',
    }),
    vueTermui({
      vue: {
        template: {
          compilerOptions: {
            // TresJS scene tags are host elements of Tres's own custom
            // renderer (mounted by <TresCanvasContext>), not components.
            // Mirrors @tresjs/core's templateCompilerOptions.
            // (TresTerminal is our real component wrapping the context.)
            isCustomElement: (tag) =>
              (/^Tres[A-Z]/.test(tag) &&
                !['TresCanvas', 'TresCanvasContext', 'TresTerminal'].includes(tag)) ||
              tag === 'primitive',
          },
        },
      },
    }),
  ],
})
