import Vuminal from 'vuminal'
import tomConnector from '@vuminal/connector-tom'
import App from './App.vue'

const draw = Vuminal(tomConnector)

draw(App)
