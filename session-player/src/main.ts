// xterm + JetBrains Mono styles are imported by SessionPlayer itself so the
// component is self-contained; this app only needs its own page styles.
import './style.css'
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
