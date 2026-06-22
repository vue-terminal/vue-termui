import { createMemoryHistory, createRouter } from 'vue-router'
import { routes } from 'vue-router/auto-routes'
import { createApp } from 'vue-termui'
import App from './App.vue'

// In-memory history: there is no URL bar in a terminal, so navigation state
// lives entirely in memory.
const router = createRouter({
  history: createMemoryHistory(),
  routes,
})

// Start on a specific demo. Memory history begins at "/", so push the demo we
// want to render first.
router.push('/demos/bouncing-box')

const app = await createApp(App, null, { exitOnCtrlC: true })
app.use(router)

// Wait for the initial navigation to resolve so the first frame already has
// the matched component.
await router.isReady()

app.mount()
