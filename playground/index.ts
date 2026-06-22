// NOTE: temporary. The playground talks to @opentui/core directly until
// vue-termui exposes its own Vue-renderer API (see todos.json). OpenTUI is an
// implementation detail of vue-termui and is intentionally not re-exported.
import { createCliRenderer, Box, Text } from '@opentui/core'

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
