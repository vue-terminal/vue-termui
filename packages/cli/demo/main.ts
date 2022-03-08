import { createApp } from 'vue-termui'
import App from './CenteredDemo.vue'
// import App from './demo/App.vue'
// import App from './demo/Counter.vue'
// import App from './demo/Borders.vue'

createApp(App).mount({
  // TODO: is this option really useful? when rendering once, any change should do a full reload
  // renderOnce: true,
})
