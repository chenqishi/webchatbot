import './polyfills'
import { createApp } from 'vue'
import App from './App.vue'
import './styles.css'
import { loadConfig } from './config'

async function bootstrap() {
  await loadConfig()
  createApp(App).mount('#app')
}

bootstrap()



