import { createRouter, createWebHistory } from 'vue-router'
import historyView from '@/views/historyView.vue'
import newMantenance from '@/views/newMantenance.vue'
import logView from '@/views/logView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
      {
        path: '/logView', name: 'LogView', component: logView
      },
    {
      path: '/history', name: 'History', component: historyView
    },
    {
      path: '/new',name: 'New',component: newMantenance
    }
  ]
})

export default router
