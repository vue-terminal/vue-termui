// import devtools from '@vue/devtools'
// import devtools from '@vue/devtools/node'
import { createApp } from 'vue-termui'
// import App from './Focusables.vue'
// import App from './Fragments.vue'
// import App from './CenteredDemo.vue'
// import App from './App.vue'
// import App from './Counter.vue'
// import App from './Borders.vue'
import App from './SelectDemo.vue'

createApp(App, {
  // swapScreens: true,
}).mount({
  // TODO: is this option really useful? when rendering once, any change should do a full reload one could just call
  // exitApp when they are done rendering on onMounted and it would would handle everything
  // renderOnce: true,
})
