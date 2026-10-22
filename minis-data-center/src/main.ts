import { createApp } from 'vue'
import { createPinia } from 'pinia'
// Arco Design 按需引入 — 组件由 unplugin-vue-components 自动注册
// 只引入全局必需的样式（Message/Notification/Modal 等反馈组件样式）
import '@arco-design/web-vue/es/message/style/css.js'
import '@arco-design/web-vue/es/notification/style/css.js'
import '@arco-design/web-vue/es/modal/style/css.js'
import '@/styles/global.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
