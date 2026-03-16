import { createRouter, createWebHistory } from 'vue-router'
import historyView from '@/views/historyView.vue'
import newMantenance from '@/views/newMantenance.vue'
import logUser from '@/views/logUser.vue'
import adminView from '@/views/adminView.vue'
import newMachine from '@/views/newMachine.vue'
import Dashboard from '@/views/Dashboard.vue'
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
      path: '/newMachine', name: 'NewMachine', component: newMachine
    },
      {
      path: '/new',name: 'New',component: newMantenance
    },
    {
      path: '/history', name: 'History', component: historyView
    },
    {
      path: '/dashboard', name: 'Dashboard', component: Dashboard
    }
    
  ]
})

export default router
