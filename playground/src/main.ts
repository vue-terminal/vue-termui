// Imported first: mirrors console output + uncaught errors into
// playground/logs/*.log before any other module runs (see ./logging).
import './logging'
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
// is overridable via the env var, and is restored across dev full reloads. The
// argv override is for prod builds, where the bundler strips `process.env` and
// the env var can't reach the bundle: `node dist/main.js /demos/foo`.
await router.push(process.argv[2] || VUE_TERMUI_START_LOCATION)
await router.isReady()

app.mount()
