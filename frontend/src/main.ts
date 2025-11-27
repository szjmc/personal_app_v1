import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

// 使用插件
app.use(createPinia())
app.use(router)

// 全局错误处理
app.config.errorHandler = (error, vm, info) => {
  console.error('Vue Error:', error)
}

app.mount('#app')

console.log('🚀 Personal App initialized')