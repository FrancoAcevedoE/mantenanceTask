import { createRouter, createWebHistory } from 'vue-router'
import historyView from '@/views/historyView.vue'
import newMantenance from '@/views/newMantenance.vue'
import logUser from '@/views/logUser.vue'
import adminView from '@/views/adminView.vue'
import newMachine from '@/views/newMachine.vue'
import Dashboard from '@/views/Dashboard.vue'

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user')
    return rawUser ? JSON.parse(rawUser) : null
  } catch {
    return null
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [

      {
        path: '/',
        redirect: () => localStorage.getItem('token') ? '/dashboard' : '/logUser'
      },

      {
        path: '/logUser', name: 'LogUser', component: logUser
      },
      {
        path: '/adminView', name: 'AdminView', component: adminView, meta: { requiresAuth: true, adminOnly: true }
      },
      {
      path: '/newMachine', name: 'NewMachine', component: newMachine, meta: { requiresAuth: true, roles: ['admin'] }
    },
      {
      path: '/new',name: 'New',component: newMantenance, meta: { requiresAuth: true }
    },
    {
      path: '/history', name: 'History', component: historyView, meta: { requiresAuth: true }
    },
    {
      path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true }
    }
    
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = getStoredUser()

  if (to.name === 'LogUser' && token) {
    return next('/dashboard')
  }

  if (to.meta.requiresAuth && !token) {
    return next('/logUser')
  }

  if (to.meta.adminOnly && user?.role !== 'admin') {
    return next('/dashboard')
  }

  if (to.meta.roles && !to.meta.roles.includes(user?.role)) {
    return next({
      path: '/dashboard',
      query: {
        denied: to.path,
        reason: 'role'
      }
    })
  }

  return next()
})

export default router
