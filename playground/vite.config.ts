import { defineConfig } from 'vite'
import VueRouter from 'vue-router/vite'
import vueTermui from 'vue-termui/vite'

export default defineConfig({
  plugins: [
    // ⚠️ VueRouter() must come before the Vue SFC plugin (provided by
    // vueTermui()). File-based routes live in src/pages; demos under
    // src/pages/demos map to /demos/*.
    VueRouter({
      routesFolder: 'src/pages',
      // A terminal app needs all routes in the single CLI bundle anyway, so
      // import pages synchronously. This also avoids dynamic `import()`, which
      // Vite wraps in a browser-only `__vitePreload` helper.
      importMode: 'sync',
      dts: 'typed-router.d.ts',
    }),
    vueTermui(),
  ],
})
