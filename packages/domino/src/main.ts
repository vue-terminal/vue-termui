import { createApp } from 'vue-termui'
import App from './App.vue'

createApp(App, { swapScreens: process.env.NODE_ENV === 'production' }).mount()
