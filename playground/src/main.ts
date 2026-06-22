// Imported first: mirrors console output + uncaught errors into
// playground/logs/*.log before any other module runs (see ./logging).
import './logging'
import { createApp } from 'vue-termui'
import App from './App.vue'
import { router } from './router'

const app = await createApp(App, null, { exitOnCtrlC: true })
app.use(router)

// Memory history performs NO initial navigation on its own, so `isReady()` would
// never resolve (and `mount()` never run → blank screen) without an explicit
// first navigation. Start on the home page (src/pages/index.vue).
await router.replace('/')
await router.isReady()

app.mount()

// Keep the launcher process alive until the user quits (Ctrl+C), then fall
// through so any post-exit cleanup could run here.
await app.waitUntilExit()
