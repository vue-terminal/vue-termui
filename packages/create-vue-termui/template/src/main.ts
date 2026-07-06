import { createApp } from 'vue-termui'
import App from './App.vue'

const app = await createApp(App, null, {
  exitOnCtrlC: true,
  // Keep the debug console dev-only. OpenTUI mirrors every process warning into
  // it, and Node delivers the FFI ExperimentalWarning *event* even with
  // --disable-warning=ExperimentalWarning (the flag only silences the stderr
  // print), so in production the console would always contain that noise —
  // a Node/OpenTUI limitation.
  consoleMode: import.meta.env.PROD ? 'disabled' : 'console-overlay',
})

app.mount()
