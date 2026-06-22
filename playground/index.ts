import { createCliRenderer, Box, Text } from 'vue-termui'

const renderer = await createCliRenderer({
  exitOnCtrlC: true,
})

renderer.root.add(
  Box(
    {
      borderStyle: 'rounded',
      padding: 1,
      flexDirection: 'column',
      gap: 1,
    },
    Text({ content: 'Hello, vue-termui 👋', fg: '#42b883' }),
    Text({ content: 'Rendered with @opentui/core', fg: '#35495e' }),
    Text({ content: 'Press Ctrl+C to exit', fg: '#888888' }),
  ),
)
