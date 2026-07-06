// Imported first: mirrors console output + uncaught errors into
// playground/logs/*.log before any other module runs (see ./logging).
import { createApp } from 'vue-termui'
import App from './App.vue'
import { router } from './router'
import { ConsolePosition } from '@opentui/core'

const app = await createApp(App, null, {
  // easier debug
  exitOnCtrlC: true,
  // Keep the debug console dev-only. OpenTUI mirrors every process warning into
  // it, and Node delivers the FFI ExperimentalWarning *event* even with
  // --disable-warning=ExperimentalWarning (the flag only silences the stderr
  // print), so in production the console would always contain that noise —
  // a Node/OpenTUI limitation.
  consoleMode: import.meta.env.PROD ? 'disabled' : 'console-overlay',
  consoleOptions: {
    position: ConsolePosition.BOTTOM,
    sizePercent: 30,
  },
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

// Keep the launcher process alive until the user quits (Ctrl+C), then fall
// through so any post-exit cleanup could run here.
// await app.waitUntilExit()
