import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'bootstrap-icons/font/bootstrap-icons.css'
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'
import './assets/style.css'
import { createNotifier } from './utils/notifications'

import App from './App.vue'
import router from './router'

const app = createApp(App)

const toastOptions = {
	position: 'top-right',
	timeout: 3500,
	closeOnClick: true,
	pauseOnFocusLoss: true,
	pauseOnHover: true,
	draggable: true,
	newestOnTop: true
}

app.use(createPinia())
app.use(router)
app.use(Toast, toastOptions)
app.config.globalProperties.$notify = createNotifier(app.config.globalProperties.$toast)

app.mount('#app')
