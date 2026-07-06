import { createRouter, createWebHistory } from 'vue-router'
import historyView from '@/views/historyView.vue'
import newMantenance from '@/views/newMantenance.vue'
import logUser from '@/views/logUser.vue'
import adminView from '@/views/adminView.vue'
import newMachine from '@/views/newMachine.vue'
import Dashboard from '@/views/Dashboard.vue'
import NotificationHistory from '@/views/NotificationHistory.vue'
import inventoryView from '@/views/inventoryView.vue'
import ProductCreateView from '@/views/ProductCreateView.vue'
import ProductDetailView from '@/views/ProductDetailView.vue'
import ProductEditView from '@/views/ProductEditView.vue'
import BulkPriceUpdateView from '@/views/BulkPriceUpdateView.vue'
import StockManagementView from '@/views/StockManagementView.vue'
import InventoryDashboardView from '@/views/InventoryDashboardView.vue'
import ProductLogView from '@/views/ProductLogView.vue'
import ProductGroupView from '@/views/ProductGroupView.vue'
import ColorCatalogView from '@/views/ColorCatalogView.vue'
import CrmView from '@/views/CrmView.vue'
import MateriasPrimasView from '@/views/MateriasPrimasView.vue'
import ProveedoresView from '@/views/ProveedoresView.vue'
import ResinaPlantaView from '@/views/ResinaPlantaView.vue'
import ProduccionProgramacionView from '@/views/ProduccionProgramacionView.vue'
import ProduccionSeguimientoView from '@/views/ProduccionSeguimientoView.vue'

const getStoredUser = () => {
  try {
    const rawUser = sessionStorage.getItem('user')
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
        redirect: () => sessionStorage.getItem('token') ? '/dashboard' : '/logUser'
      },

      {
        path: '/logUser', name: 'LogUser', component: logUser
      },
      {
        path: '/adminView', name: 'AdminView', component: adminView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas'] }
      },
      {
      path: '/newMachine', name: 'NewMachine', component: newMachine, meta: { requiresAuth: true, roles: ['admin'], bodyClass: 'bg-maintenance' }
    },
      {
      path: '/new',name: 'New',component: newMantenance, meta: { requiresAuth: true, roles: ['admin', 'operario'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/history', name: 'History', component: historyView, meta: { requiresAuth: true, roles: ['admin', 'operario', 'supervisor'] }
    },
    {
      path: '/dashboard', name: 'Dashboard', component: Dashboard, meta: { requiresAuth: true, roles: ['admin', 'operario', 'supervisor'] }
    },
    {
      path: '/notifications-history', name: 'NotificationsHistory', component: NotificationHistory, meta: { requiresAuth: true, roles: ['admin', 'operario', 'supervisor', 'vendedor', 'admin_ventas'] }
    },
    {
      path: '/inventory', name: 'InventoryView', component: inventoryView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/product/new', name: 'ProductCreate', component: ProductCreateView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/product/:id', name: 'ProductDetail', component: ProductDetailView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/product/:id/edit', name: 'ProductEdit', component: ProductEditView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/bulk-price', name: 'BulkPrice', component: BulkPriceUpdateView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/stock-management', name: 'StockManagement', component: StockManagementView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/inv-dashboard', name: 'InventoryDashboard', component: InventoryDashboardView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/product-log', name: 'ProductLog', component: ProductLogView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/product-groups', name: 'ProductGroups', component: ProductGroupView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/color-catalog', name: 'ColorCatalog', component: ColorCatalogView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/crm', name: 'CRM', component: CrmView, meta: { requiresAuth: true, roles: ['admin', 'admin_ventas', 'vendedor'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/compras/materias-primas', name: 'MateriasPrimas', component: MateriasPrimasView, meta: { requiresAuth: true, roles: ['admin', 'admin_compras', 'compras'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/compras/proveedores', name: 'Proveedores', component: ProveedoresView, meta: { requiresAuth: true, roles: ['admin', 'admin_compras', 'compras'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/produccion/resinas', name: 'ProduccionResinas', component: ResinaPlantaView, meta: { requiresAuth: true, roles: ['admin', 'produccion'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/produccion/programacion', name: 'ProduccionProgramacion', component: ProduccionProgramacionView, meta: { requiresAuth: true, roles: ['admin', 'produccion'], bodyClass: 'bg-maintenance' }
    },
    {
      path: '/produccion/seguimiento', name: 'ProduccionSeguimiento', component: ProduccionSeguimientoView, meta: { requiresAuth: true, roles: ['admin', 'produccion'], bodyClass: 'bg-maintenance' }
    }

  ]
})

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('token')
  const user = getStoredUser()

  if (to.name === 'LogUser' && token) {
    return next('/dashboard')
  }

  if (to.meta.requiresAuth && !token) {
    return next('/logUser')
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
