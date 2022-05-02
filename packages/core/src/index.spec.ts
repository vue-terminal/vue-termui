import cliTruncate from 'cli-truncate'
import sliceAnsi from 'slice-ansi'
import {
  createApp,
  defineComponent,
  h,
  TuiBox,
  TuiText,
  ref,
  onKeyData,
  nextTick,
} from './index'
import { createStdin, createStdout } from './mocks/stdmock'

// TODO: nextTick should schedule a render or force it and await for the render
const delay = (t: number) => new Promise((r) => setTimeout(r, t))

describe('Full App', () => {
  const App = defineComponent({
    setup() {
      const n = ref(0)

      onKeyData('A', () => n.value++)

      return () =>
        h(
          TuiBox,
          {},
          {
            default: () =>
              h(TuiText, {}, { default: () => 'Hello ' + n.value }),
          }
        )
    },
  })

  it('works', async () => {
    const stdout = createStdout()
    const stderr = createStdout()
    const stdin = createStdin()

    const app = createApp(App, {
      stdout,
      stdin,
      stderr,
    })

    app.mount()

    expect(stdout.write).toHaveBeenLastCalledWith(
      expect.stringContaining('Hello 0')
    )

    stdin.emit('data', 'A')
    await nextTick()
    await delay(40)

    expect(stdout.write).toHaveBeenLastCalledWith(
      expect.stringContaining('Hello 1')
    )
    app.unmount()
  })
})
