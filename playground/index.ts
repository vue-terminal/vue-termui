import { createApp, defineComponent, h, onUnmounted, ref, shallowRef } from 'vue-termui'

const App = defineComponent({
  setup() {
    const seconds = ref(0)
    const timer = setInterval(() => {
      seconds.value++
    }, 1000)
    onUnmounted(() => clearInterval(timer))

    return () =>
      h('box', { borderStyle: 'rounded', padding: 1, flexDirection: 'column', gap: 1 }, [
        h('text', { fg: '#42b883' }, 'Hello, vue-termui 👋'),
        h('text', { fg: '#35495e' }, 'Rendered with a Vue custom renderer'),
        h('text', { fg: '#888888' }, `Uptime: ${seconds.value}s`),
        h('text', { fg: '#888888' }, 'Press Ctrl+C to exit'),
      ])
  },
})

await createApp(App, null, { exitOnCtrlC: true })
