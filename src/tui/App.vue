<script setup lang="ts">
import ansiEscapes from 'ansi-escapes'
import { Span } from './renderer/components'
import { renderRoot } from './renderer/render'
import { provide } from '@vue/runtime-core'
import { scheduleUpdateSymbol } from './renderer/injectionSymbols'

const log = useLog()

onBeforeUpdate(() => { })

const rootNode = useRootNode()
const stdout = useStdout()

let lastOutput: string = ''

function myRenderThatShouldBeOutside() {
  // console.log('need update', i?.root.vnode.el)
  const { output, outputHeight, staticOutput } = renderRoot(
    rootNode,
    stdout.columns || 80
  )

  // If <Static> output isn't empty, it means new children have been added to it
  const hasStaticOutput = staticOutput && staticOutput !== '\n'

  // console.log('update', { hasStaticOutput })

  if (outputHeight >= stdout.rows) {
    stdout.write(ansiEscapes.clearTerminal + /* fullStaticOutput + */ output)

    lastOutput = output

    return
  }

  if (!hasStaticOutput && output !== lastOutput) {
    log(output)
  }

  lastOutput = output
}

let interval: NodeJS.Timer
let needsUpdate = false
onMounted(() => {
  interval = setInterval(() => {
    if (needsUpdate) {
      myRenderThatShouldBeOutside()
      needsUpdate = false
    }
  }, 32)
  myRenderThatShouldBeOutside()
})
onUnmounted(() => {
  clearInterval(interval)
})

function scheduleUpdate() {
  needsUpdate = true
}
provide(scheduleUpdateSymbol, scheduleUpdate)

onUpdated(() => {
  scheduleUpdate()
})

onErrorCaptured((error, target) => {
  console.error(error)
  console.log(target)
})

const n = ref(0)
onMounted(() => {
  setInterval(() => {
    n.value++
  }, 1000)
})
</script>

<template>
  <Span color="green">
    Counter:
    <Span bold>{{ n }}</Span>.
    <Span color="whiteBright">
      is it Odd?
      <Span :inverse="n % 2 == 0">
        {{
          n % 2 == 0 ? 'No' : 'Yes'
        }}
      </Span>
    </Span>
  </Span>
</template>
