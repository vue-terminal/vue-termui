// Imported first: mirrors console output + uncaught errors into
// playground/logs/*.log before any other module runs (see ./logging).
import { createApp } from 'vue-termui'
import App from './App.vue'
import { router } from './router'

const app = await createApp(App, null, {
  // easier debug
  exitOnCtrlC: true,
  useKittyKeyboard: {
    // needed for keyups, not supported within tmux, ssh, and other stuff
    events: true,
  },
})

app.use(router)
// memory history has no initial route; VUE_TERMUI_START_LOCATION defaults to '/',
// is overridable via the env var, and is restored across dev full reloads.
await router.push(VUE_TERMUI_START_LOCATION)
await router.isReady()

app.mount()
