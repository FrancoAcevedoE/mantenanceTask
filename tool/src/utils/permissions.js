import { computed } from 'vue'

function getUser() {
  try { return JSON.parse(sessionStorage.getItem('user') || '{}') } catch { return {} }
}

export function usePermissions() {
  const user = computed(getUser)
  const role = computed(() => user.value?.role || '')

  const isAdmin        = computed(() => role.value === 'admin')
  const isAdminVentas  = computed(() => role.value === 'admin_ventas')
  const isVendedor     = computed(() => role.value === 'vendedor')
  const isAdminCompras = computed(() => role.value === 'admin_compras')
  const isCompras      = computed(() => role.value === 'compras')

  // Puede gestionar inventario y CRM (crear, editar, eliminar)
  const canManage        = computed(() => ['admin', 'admin_ventas'].includes(role.value))
  // Puede crear/editar/eliminar materias primas y proveedores
  const canManageCompras = computed(() => ['admin', 'admin_compras'].includes(role.value))
  // Puede ver y hacer movimientos en compras
  const canUseCompras    = computed(() => ['admin', 'admin_compras', 'compras'].includes(role.value))

  // Solo puede ver/simular, no guardar cambios destructivos
  const readOnly      = computed(() => role.value === 'vendedor')

  return {
    role, isAdmin, isAdminVentas, isVendedor, isAdminCompras, isCompras,
    canManage, canManageCompras, canUseCompras, readOnly,
    userId: computed(() => user.value?._id || user.value?.id || '')
  }
}
