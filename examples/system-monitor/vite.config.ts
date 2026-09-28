import { defineConfig, lazyPlugins } from 'vite-plus'
import vueTermui from 'vue-termui/vite'

export default defineConfig({ plugins: lazyPlugins(() => [vueTermui()]) })
