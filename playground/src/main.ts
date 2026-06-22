import { createApp } from 'vue-termui'
import App from './App.vue'
import { router } from './router'

// Start on a specific demo. Memory history begins at "/", so push the demo we
// want to render first.
router.push('/demos/bouncing-box')

const app = await createApp(App, null, { exitOnCtrlC: true })
app.use(router)

// Wait for the initial navigation to resolve so the first frame already has
// the matched component.
await router.isReady()

app.mount()
