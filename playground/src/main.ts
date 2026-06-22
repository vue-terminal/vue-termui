import { createApp } from 'vue-termui'
import App from './App.vue'
import { router } from './router'

// Memory history begins at "/" — the home page (src/pages/index.vue).
const app = await createApp(App, null, { exitOnCtrlC: true })
app.use(router)

// Wait for the initial navigation to resolve so the first frame already has
// the matched component.
await router.isReady()

app.mount()

// Keep the launcher process alive until the user quits (Ctrl+C), then fall
// through so any post-exit cleanup could run here.
await app.waitUntilExit()
