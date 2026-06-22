/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue-termui'
  const component: DefineComponent<{}, {}, any>
  export default component
}
