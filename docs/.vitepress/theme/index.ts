import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { defineAsyncComponent, h } from 'vue'
import AnimatedLogo from './components/AnimatedLogo.vue'
import './styles/vars.css'

const theme: Theme = {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(AnimatedLogo),
    }),
  enhanceApp({ app }) {
    // The player lives here in the docs (the session-player app reuses it from
    // this package). Async so xterm is code-split and only loaded on pages that
    // embed a player; use it in markdown wrapped in <ClientOnly> (browser-only).
    app.component(
      'SessionPlayer',
      defineAsyncComponent(() => import('./components/SessionPlayer.vue')),
    )
  },
}

export default theme
