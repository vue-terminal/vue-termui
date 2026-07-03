import { createApp } from 'vue-termui'
import App from './App.vue'

const app = await createApp(App, null, {
  exitOnCtrlC: true,
})

app.mount()
