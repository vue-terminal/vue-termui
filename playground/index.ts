import { useHello, version } from 'vue-termui'

const greeting = useHello('vue-termui')

console.log(greeting.value)
console.log(`vue-termui v${version}`)
