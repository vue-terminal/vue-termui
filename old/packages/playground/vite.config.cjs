import { defineConfig } from 'vite'
import VueTermui from 'vite-plugin-vue-termui'
import { resolve } from 'path'

export default defineConfig({
  define: {
    __DEV__: `process.env.NODE_ENV === "development"`,
  },
  ssr: {
    noExternal: [
      'chalk',
      'ansi-escapes',
      'picocolors',
      'cli-boxes',
      'cli-cursor',
      'cli-truncate',
      'indent-string',
      'strip-ansi',
      'ansi-regex',
      'ansi-styles',
      'supports-color',
      'eastasianwidth',
      'emoji-regex',
      'supports-hyperlinks',
      'onetime',
      'signal-exit',
      'ws',
      'slice-ansi',
      'string-width',
      'type-fest',
      'widest-line',
      'wrap-ansi',
      'yoga-layout',
      'yoga-layout-prebuilt',
      'is-fullwidth-code-point',
      'terminal-link',
      'restore-cursor',
    ],
  },
  resolve: {
    alias: {
      // Use development version instead of dist
      'vue-termui': resolve('../core/src/index.ts'),
    },
  },

  plugins: [
    VueTermui({
      autoImportOptions: {
        include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/],
        imports: ['vitest'],
        dts: true,
      },
    }),
  ],
})
