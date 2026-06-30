// Imported first: mirrors console output + uncaught errors into
// playground/logs/*.log before any other module runs (see ./logging).
import { createApp } from 'vue-termui'
import App from './App.vue'
import { router } from './router'
import { ConsolePosition } from '@opentui/core'

const app = await createApp(App, null, {
  consoleOptions: {
    position: ConsolePosition.BOTTOM,
    sizePercent: 30,
  },
})

app.use(router)
// memory history has no initial route
await router.push('/')
await router.isReady()

app.mount()

// Keep the launcher process alive until the user quits (Ctrl+C), then fall
// through so any post-exit cleanup could run here.
// await app.waitUntilExit()
