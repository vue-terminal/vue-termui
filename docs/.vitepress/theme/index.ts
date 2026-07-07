import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import { h } from 'vue'
import AnimatedLogo from './components/AnimatedLogo.vue'
import './styles/vars.css'

const theme: Theme = {
  extends: DefaultTheme,
  Layout: () =>
    h(DefaultTheme.Layout, null, {
      'home-hero-image': () => h(AnimatedLogo),
    }),
}

export default theme
