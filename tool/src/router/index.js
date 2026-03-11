import { createRouter, createWebHistory } from 'vue-router'
import historyView from '@/views/historyView.vue'
import newMantenance from '@/views/newMantenance.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/history', name: 'History', component: historyView
    },
    {
      path: '/new',name: 'New',component: newMantenance
    }
  ]
})

export default router
