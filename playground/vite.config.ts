import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/**
 * Host tags understood by the vue-termui renderer. They are neither DOM nor SVG
 * elements nor components, so the SFC compiler must be told to leave them as
 * plain element vnodes (`createElementVNode('box', …)`) instead of trying to
 * resolve them as components.
 */
const TUI_TAGS = new Set<string>(['box', 'text'])

export default defineConfig({
  build: {
    // Node 26 runs the output directly; no syntax down-leveling needed.
    target: 'esnext',
    outDir: 'dist',
    // Single self-contained terminal entry, not a web app — no html shell.
    minify: false,
    rolldownOptions: {
      input: 'src/main.ts',
      external: [
        // Resolved from node_modules at runtime so there is a single shared
        // `@vue/runtime-core` instance (vnode/instance interop) and the native
        // FFI module is loaded for real (`@opentui/core` must never be bundled).
        /^node:/,
        'vue',
        '@vue/runtime-core',
        'vue-termui',
        '@opentui/core',
      ],
      output: {
        format: 'esm',
        entryFileNames: '[name].mjs',
        chunkFileNames: '[name].mjs',
      },
    },
  },
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => TUI_TAGS.has(tag),
        },
      },
    }),
  ],
})
