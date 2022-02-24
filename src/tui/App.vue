<script setup lang="ts">
import ansiEscapes from 'ansi-escapes'
import { renderRoot } from './renderer/render'

const log = useLog()

onBeforeUpdate(() => {})

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

onMounted(myRenderThatShouldBeOutside)
onUpdated(myRenderThatShouldBeOutside)

const n = ref(0)
onMounted(() => {
  setInterval(() => {
    n.value++
  }, 1000)
})
</script>

<template>
  <ink-text v-for="i in n">Hello ({{ i }}) at {{ new Date() }}</ink-text>
  <!-- <div> -->
  <ink-text>Counter: {{ n }} </ink-text>
  <!-- <tui-test hey="true" disabled> child </tui-test> -->
  <!-- <div class="hello">child</div>
    <p ref="root">
      child
      <span>hey</span>
    </p> -->
  <!-- </div> -->
</template>
