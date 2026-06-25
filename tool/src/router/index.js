import { createRouter, createWebHistory } from 'vue-router'
import historyView from '@/views/historyView.vue'
import newMantenance from '@/views/newMantenance.vue'
import logUser from '@/views/logUser.vue'
import adminView from '@/views/adminView.vue'
import newMachine from '@/views/newMachine.vue'
import Dashboard from '@/views/Dashboard.vue'
import NotificationHistory from '@/views/NotificationHistory.vue'
import sellerView from '@/views/sellerView.vue'
import inventoryView from '@/views/inventoryView.vue'
import ProductCreateView from '@/views/ProductCreateView.vue'
import ProductDetailView from '@/views/ProductDetailView.vue'
import ProductEditView from '@/views/ProductEditView.vue'
import BulkPriceUpdateView from '@/views/BulkPriceUpdateView.vue'
import StockManagementView from '@/views/StockManagementView.vue'
import InventoryDashboardView from '@/views/InventoryDashboardView.vue'
import CrmView from '@/views/CrmView.vue'

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
      path: '/new',name: 'New',component: newMantenance, meta: { requiresAuth: true, roles: ['admin', 'operario'] }
    },
    {
      path: '/history', name: 'History', component: historyView, meta: { requiresAuth: true, roles: ['admin', 'operario', 'supervisor'] }
    },
    {
      path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true }
    },
    {
      path: '/notifications-history', name: 'NotificationsHistory', component: NotificationHistory, meta: { requiresAuth: true, roles: ['admin', 'operario', 'supervisor'] }
    },
    {
      path: '/seller', name: 'SellerView', component: sellerView, meta: { requiresAuth: true, roles: ['admin', 'vendedor'] }
    },
    {
      path: '/inventory', name: 'InventoryView', component: inventoryView, meta: { requiresAuth: true, roles: ['admin', 'vendedor'] }
    },
    {
      path: '/product/new', name: 'ProductCreate', component: ProductCreateView, meta: { requiresAuth: true, roles: ['admin'] }
    },
    {
      path: '/product/:id', name: 'ProductDetail', component: ProductDetailView, meta: { requiresAuth: true, roles: ['admin', 'vendedor'] }
    },
    {
      path: '/product/:id/edit', name: 'ProductEdit', component: ProductEditView, meta: { requiresAuth: true, roles: ['admin', 'vendedor'] }
    },
    {
      path: '/bulk-price', name: 'BulkPrice', component: BulkPriceUpdateView, meta: { requiresAuth: true, roles: ['admin', 'vendedor'] }
    },
    {
      path: '/stock-management', name: 'StockManagement', component: StockManagementView, meta: { requiresAuth: true, roles: ['admin', 'vendedor'] }
    },
    {
      path: '/inv-dashboard', name: 'InventoryDashboard', component: InventoryDashboardView, meta: { requiresAuth: true, roles: ['admin', 'vendedor'] }
    },
    {
      path: '/crm', name: 'CRM', component: CrmView, meta: { requiresAuth: true, roles: ['admin', 'vendedor'] }
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
