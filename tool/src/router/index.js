import { createRouter, createWebHistory } from 'vue-router'
import historyView from '@/views/historyView.vue'
import newMantenance from '@/views/newMantenance.vue'
import logUser from '@/views/logUser.vue'
import adminView from '@/views/adminView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

      {
        path: '/logUser', name: 'LogUser', component: logUser
      },
      {
        path: '/adminView', name: 'AdminView', component: adminView
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
