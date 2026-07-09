<script setup lang="ts">
// Ported from @opentui/examples src/styled-text-demo.ts
import {
  bg,
  bold,
  Box,
  computed,
  fg,
  onKeyDown,
  ref,
  shallowRef,
  t,
  Text,
  underline,
  useInterval,
} from 'vue-termui'

// The named color helpers (red(), green(), …) are not exported by vue-termui;
// fg()/bg() with hex colors cover them.
const red = fg('#E74C3C')
const green = fg('#2ECC71')
const blue = fg('#4A9EFF')
const bgYellow = bg('#F1C40F')

// Example 1 — template literals with nested styles
const houseText = t`There's a ${underline(blue('house'))},
With a ${bold(blue('window'))},
And a ${blue('corvette')}
And everything is blue`

// Example 2 — status lines
const statusText = t`${bold(red('ERROR:'))} Connection failed
${bold(green('SUCCESS:'))} Data loaded
${bold(fg('#FFA500')('WARNING:'))} Low memory
${bgYellow(fg('black')(' NOTICE '))} System update available`

// Instructions (the original's ↑/↓ speed keys became F/S; arrow keys drive the
// app shell's sidebar). link() is not exported by vue-termui, so the hyperlink
// is plain underlined text.
const instructionsText = t`${bold('Styled Text Demo')}
${fg('#888')('F/S to control the dashboard update speed')}

${underline('Features demonstrated:')}
• Template literals with ${blue('colors')}
• ${bold('Bold')}, ${underline('underlined')}, and other styles
• Background colors like ${bgYellow(fg('black')('this'))}
• Custom hex colors like ${fg('#FF6B6B')('this red')}
• Dynamic updates with ${green('controllable frequency')}
• Complex templates with ${red('many variables')}
• Hyperlinks: ${underline(blue('https://opentui.com'))}`

// Number and boolean interpolation support
const typesText = t`${bold('Type Examples:')}
Number: ${green(42)}
Boolean: ${red(true)}
Float: ${blue(Math.PI.toFixed(2))}
Calculated: ${fg('#00FFFF')(Math.floor(Math.random() * 100))}`

// Dashboard tick rate (the original used a per-frame callback at 60fps;
// here a 50ms interval, i.e. 20 ticks/s).
const TICKS_PER_SECOND = 20

// Dynamic text refreshed every second
const seconds = ref(0)
useInterval(() => seconds.value++, 1000)
const dynamicText = computed(
  () => t`${bold('Frame:')} ${seconds.value * TICKS_PER_SECOND}
${blue('Time:')} ${seconds.value.toFixed(1)}s
${underline('Dynamic:')} ${bold(fg('#FF6B6B')(Math.sin(seconds.value * 2) > 0 ? 'UP' : 'DOWN'))}`,
)

// Complex dashboard — rebuilt every `updateFrequency` ticks
const updateFrequency = ref(1)
const startTime = Date.now()
let ticks = 0

function buildDashboardText() {
  const elapsedSeconds = (Date.now() - startTime) / 1000

  const cpuLoad = Math.sin(elapsedSeconds * 0.5) * 50 + 50
  const memoryUsage = Math.cos(elapsedSeconds * 0.3) * 30 + 70
  const networkSpeed = Math.abs(Math.sin(elapsedSeconds * 2)) * 1000
  const temperature = Math.sin(elapsedSeconds * 0.1) * 20 + 60
  const batteryLevel = Math.max(0, 100 - elapsedSeconds * 0.5)
  const randomValue = Math.floor(Math.random() * 9999)
  const waveValue = Math.sin(elapsedSeconds * 3) * 10
  const progressBar = '█'.repeat(Math.floor(((elapsedSeconds % 10) / 10) * 20))

  const connectionStatus = Math.sin(elapsedSeconds) > 0 ? 'ONLINE' : 'OFFLINE'
  const systemHealth = cpuLoad < 80 ? 'GOOD' : 'HIGH'
  const alertLevel = temperature > 75 ? 'CRITICAL' : 'NORMAL'
  const freq = updateFrequency.value

  return t`${bold('System Stats:')} ${fg('#888')(`[Update: ${freq === 1 ? 'Every Tick' : `Every ${freq} ticks`}]`)}
${blue('Uptime:')} ${fg('#00FF00')(elapsedSeconds.toFixed(2))}s ${fg('#666')(`(${Math.floor(elapsedSeconds / 60)}m ${Math.floor(elapsedSeconds % 60)}s)`)}
${red('CPU Load:')} ${cpuLoad > 80 ? red(bold(`${cpuLoad.toFixed(1)}%`)) : green(`${cpuLoad.toFixed(1)}%`)} ${fg('#444')('█'.repeat(Math.floor(cpuLoad / 5)))}
${fg('#FF6B6B')('Memory:')} ${memoryUsage > 85 ? red(bold(`${memoryUsage.toFixed(1)}%`)) : fg('#FFA500')(`${memoryUsage.toFixed(1)}%`)}
${fg('#9B59B6')('Network:')} ${networkSpeed > 500 ? green(bold(`${networkSpeed.toFixed(0)} KB/s`)) : fg('#FFA500')(`${networkSpeed.toFixed(0)} KB/s`)}
${fg('#E74C3C')('Temp:')} ${temperature > 75 ? red(bold(`${temperature.toFixed(1)}°C`)) : blue(`${temperature.toFixed(1)}°C`)}
${fg('#F39C12')('Battery:')} ${batteryLevel < 20 ? red(bold(`${batteryLevel.toFixed(0)}%`)) : green(`${batteryLevel.toFixed(0)}%`)}
${underline('Connection:')} ${connectionStatus === 'ONLINE' ? green(bold(connectionStatus)) : red(bold(connectionStatus))}
${underline('Health:')} ${systemHealth === 'GOOD' ? green(bold(systemHealth)) : red(bold(systemHealth))}
${underline('Alert:')} ${alertLevel === 'NORMAL' ? green(bold(alertLevel)) : bgYellow(red(bold(alertLevel)))}
${fg('#3498DB')('Random ID:')} ${fg('#E67E22')(randomValue.toString().padStart(4, '0'))}
${fg('#1ABC9C')('Wave:')} ${waveValue >= 0 ? green(`+${waveValue.toFixed(2)}`) : red(waveValue.toFixed(2))}
${fg('#9B59B6')('Progress:')} ${fg('#00FF00')(progressBar.padEnd(20, '░'))}
${fg('#34495E')('Tick:')} ${fg('#ECF0F1')(ticks)} ${fg('#7F8C8D')(`(Every ${freq})`)}
${fg('#2ECC71')('Status:')} ${bold(fg('#E74C3C')('●'))} ${alertLevel === 'CRITICAL' ? red('SYSTEM ALERT') : green('ALL SYSTEMS GO')}

${bold(fg('#F1C40F')('Controls:'))} ${fg('#BDC3C7')('F = faster, S = slower')}`
}

const dashboardText = shallowRef(buildDashboardText())
useInterval(() => {
  ticks++
  if (ticks % updateFrequency.value === 0) {
    dashboardText.value = buildDashboardText()
  }
}, 1000 / TICKS_PER_SECOND)

onKeyDown((key) => {
  if (key.name === 'f') {
    updateFrequency.value = Math.max(1, updateFrequency.value - 1)
  } else if (key.name === 's') {
    updateFrequency.value = Math.min(60, updateFrequency.value + 1)
  }
})
</script>

<template>
  <Box flexDirection="column" :flexGrow="1" backgroundColor="#001122" :padding="1" :gap="1">
    <Box flexDirection="row" :gap="4">
      <Box flexDirection="column" :gap="1" :width="34">
        <Text :content="houseText" />
        <Text :content="statusText" />
        <Text :content="dynamicText" />
        <Text :content="typesText" />
      </Box>
      <Text :content="instructionsText" fg="#CCCCCC" :width="60" />
    </Box>
    <Box
      :width="72"
      :height="21"
      backgroundColor="#001122"
      borderColor="#00FFFF"
      borderStyle="single"
      title="COMPLEX REAL-TIME DASHBOARD"
      titleAlignment="center"
      :padding="1"
    >
      <Text :content="dashboardText" />
    </Box>
  </Box>
</template>
