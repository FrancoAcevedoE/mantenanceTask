<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotificationBell from '@/components/NotificationBell.vue'
import UserManual from '@/components/UserManual.vue'
import { useNotificationsStore } from '@/stores/notifications'

const route = useRoute()
const router = useRouter()
const notificationsStore = useNotificationsStore()

const getStoredUser = () => {
  try {
    const rawUser = sessionStorage.getItem('user')
    return rawUser ? JSON.parse(rawUser) : null
  } catch {
    return null
  }
}

const currentUser = computed(() => { route.fullPath; return getStoredUser() })
const showNav = computed(() => route.name !== 'LogUser' && Boolean(sessionStorage.getItem('token')))

const role = computed(() => currentUser.value?.role)
const isAdmin        = computed(() => role.value === 'admin')
const canMantenim    = computed(() => ['admin', 'operario', 'supervisor'].includes(role.value))
const canVentas      = computed(() => ['admin', 'admin_ventas', 'vendedor'].includes(role.value))
const canCompras     = computed(() => ['admin', 'admin_compras', 'compras'].includes(role.value))
const canProduccion  = computed(() => ['admin', 'produccion'].includes(role.value))
const canNewWork     = computed(() => ['admin', 'operario'].includes(role.value))
const canHistory     = computed(() => !['vendedor', 'admin_ventas'].includes(role.value))
const canNewMachine  = computed(() => isAdmin.value)
const canUsers       = computed(() => ['admin', 'admin_ventas'].includes(role.value))

// ── Módulos colapsables ─────────────────────────────────────────────────────
const MANTENIM_PATHS  = ['/dashboard', '/new', '/history', '/notifications-history', '/newMachine']
const VENTAS_PATHS    = ['/inventory', '/product', '/bulk-price', '/stock-management', '/inv-dashboard', '/product-log', '/product-groups', '/color-catalog', '/crm']
const COMPRAS_PATHS   = ['/compras']
const PRODUCCION_PATHS = ['/produccion']

function pathInGroup(paths) {
  return paths.some(p => route.path === p || route.path.startsWith(p + '/') || route.path.startsWith(p))
}

const openMantenim   = ref(false)
const openVentas     = ref(false)
const openCompras    = ref(false)
const openProduccion = ref(false)

function autoOpenModules() {
  if (pathInGroup(MANTENIM_PATHS))   openMantenim.value   = true
  if (pathInGroup(VENTAS_PATHS))     openVentas.value     = true
  if (pathInGroup(COMPRAS_PATHS))    openCompras.value    = true
  if (pathInGroup(PRODUCCION_PATHS)) openProduccion.value = true
}

watch(() => route.path, autoOpenModules, { immediate: true })

const mobileOpen = ref(false)
const closeMobile = () => { mobileOpen.value = false }

function navTo(path) { router.push(path); closeMobile() }

const logout = async () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  notificationsStore.reset()
  closeMobile()
  await router.push('/logUser')
}

const syncNotifications = async () => {
  if (showNav.value) { await notificationsStore.initialize(); return }
  notificationsStore.reset()
}

const setBodyTheme = (theme) => {
  document.body.classList.remove('bg-login', 'bg-app', 'bg-dashboard', 'bg-notifications', 'bg-maintenance')
  if (theme) document.body.classList.add(theme)
}

watch(() => route.meta?.bodyClass, (theme) => { setBodyTheme(theme) }, { immediate: true })
onMounted(() => { syncNotifications().catch(() => {}) })
watch(() => route.fullPath, () => { syncNotifications().catch(() => {}) })
onBeforeUnmount(() => { notificationsStore.stop() })
</script>

<template>
  <NotificationBell v-if="showNav" />
  <UserManual v-if="showNav" ref="manual" />
  <div v-if="showNav && mobileOpen" class="sidebar-backdrop" @click="closeMobile" />
  <button v-if="showNav" class="mobile-toggle" @click="mobileOpen = !mobileOpen" type="button">
    <i :class="mobileOpen ? 'bi bi-x' : 'bi bi-list'"></i>
  </button>

  <aside v-if="showNav" :class="['sidebar', { 'sidebar--open': mobileOpen }]">
    <nav class="sidebar-nav">

      <!-- ── MANTENIMIENTO ── -->
      <div v-if="canMantenim" class="mod-group">
        <button class="mod-header" @click="openMantenim = !openMantenim">
          <i class="bi bi-wrench-adjustable-circle"></i>
          <span>Mantenimiento</span>
          <i :class="['mod-chevron bi', openMantenim ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
        <Transition name="sidebar-collapse">
          <div v-show="openMantenim" class="mod-links">
            <router-link to="/dashboard" @click="closeMobile">
              <i class="bi bi-bar-chart-fill"></i><span class="nav-label">Dashboard</span>
            </router-link>
            <router-link v-if="canNewWork" to="/new" @click="closeMobile">
              <i class="bi bi-plus-circle"></i><span class="nav-label">Nuevo trabajo</span>
            </router-link>
            <router-link v-if="canHistory" to="/history" @click="closeMobile">
              <i class="bi bi-clock-history"></i><span class="nav-label">Historial</span>
            </router-link>
            <router-link to="/notifications-history" @click="closeMobile">
              <i class="bi bi-bell"></i><span class="nav-label">Notificaciones</span>
            </router-link>
            <router-link v-if="canNewMachine" to="/newMachine" @click="closeMobile">
              <i class="bi bi-building-add"></i><span class="nav-label">Nueva máquina</span>
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- ── VENTAS ── -->
      <div v-if="canVentas" class="mod-group">
        <button class="mod-header" @click="openVentas = !openVentas">
          <i class="bi bi-graph-up-arrow"></i>
          <span>Ventas</span>
          <i :class="['mod-chevron bi', openVentas ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
        <Transition name="sidebar-collapse">
          <div v-show="openVentas" class="mod-links">
            <router-link to="/crm" @click="closeMobile">
              <i class="bi bi-people-fill"></i><span class="nav-label">CRM</span>
            </router-link>
            <router-link to="/inventory" @click="closeMobile">
              <i class="bi bi-box-seam"></i><span class="nav-label">Inventario</span>
            </router-link>
            <router-link to="/notifications-history" @click="closeMobile">
              <i class="bi bi-bell"></i><span class="nav-label">Notificaciones</span>
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- ── COMPRAS ── -->
      <div v-if="canCompras" class="mod-group">
        <button class="mod-header" @click="openCompras = !openCompras">
          <i class="bi bi-cart3"></i>
          <span>Compras</span>
          <i :class="['mod-chevron bi', openCompras ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
        <Transition name="sidebar-collapse">
          <div v-show="openCompras" class="mod-links">
            <router-link to="/compras/materias-primas" @click="closeMobile">
              <i class="bi bi-boxes"></i><span class="nav-label">Materias primas</span>
            </router-link>
            <router-link to="/compras/proveedores" @click="closeMobile">
              <i class="bi bi-building"></i><span class="nav-label">Proveedores</span>
            </router-link>
            <router-link to="/notifications-history" @click="closeMobile">
              <i class="bi bi-bell"></i><span class="nav-label">Notificaciones</span>
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- ── PRODUCCIÓN ── -->
      <div v-if="false" class="mod-group">
        <button class="mod-header" @click="openProduccion = !openProduccion">
          <i class="bi bi-gear-wide-connected"></i>
          <span>Producción</span>
          <i :class="['mod-chevron bi', openProduccion ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
        <div v-show="openProduccion" class="mod-links">
          <router-link to="/produccion/resinas" @click="closeMobile">
            <i class="bi bi-droplet-half"></i><span class="nav-label">Planta de resinas</span>
          </router-link>
          <router-link to="/produccion/programacion" @click="closeMobile">
            <i class="bi bi-calendar-week"></i><span class="nav-label">Programación</span>
          </router-link>
          <router-link to="/produccion/seguimiento" @click="closeMobile">
            <i class="bi bi-clipboard2-check"></i><span class="nav-label">Seguimiento</span>
          </router-link>
        </div>
      </div>

      <!-- ── ADMIN ── -->
      <div v-if="canUsers" class="mod-group mod-group--admin">
        <router-link to="/adminView" @click="closeMobile" class="mod-link-flat">
          <i class="bi bi-person-plus-fill"></i><span class="nav-label">Usuarios</span>
        </router-link>
      </div>

    </nav>

    <div class="sidebar-bottom-actions">
      <button class="sidebar-manual-btn" @click="$refs.manual.open = true; closeMobile()" type="button">
        <i class="bi bi-question-circle-fill"></i>
        <span class="nav-label">Manual de usuario</span>
      </button>
      <button class="sidebar-logout" @click="logout" type="button">
        <i class="bi bi-box-arrow-right"></i>
        <span class="nav-label">Cerrar sesión</span>
      </button>
    </div>
  </aside>

  <main :class="['app-content', { 'with-nav': showNav, 'nav-open': showNav && mobileOpen }]">
    <router-view />
  </main>
</template>

<style>
:root {
  --sidebar-w-open: 240px;
  --color-bg: #f1f5f9;
  --color-surface: #ffffff;
  --color-surface-2: #f8fafc;
  --color-border: #e2e8f0;
  --color-text: #1e293b;
  --color-muted: #64748b;
  --color-primary: #3b6b2e;
  --color-primary-hover: #2d5224;
  --color-danger: #dc2626;
  --sidebar-bg: #ffffff;
  --sidebar-text: #475569;
  --sidebar-accent: #3b6b2e;
}

body.bg-login {
  background: linear-gradient(160deg, #f8fafc 0%, #e8ede4 60%, #f1f5f9 100%);
}
body.bg-app,
body.bg-dashboard,
body.bg-notifications { background: #f1f5f9; }
body.bg-maintenance {
  background: rgb(103, 111, 62);
  background-attachment: fixed;
}

html, body, #app { height: 100vh; max-height: 100vh; overflow: hidden; }
html, body { overflow-x: hidden; max-width: 100%; }

body {
  margin: 0; padding: 0;
  background: var(--color-bg, #f1f5f9);
  color: var(--color-text, #1e293b);
  font-family: 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

#app { display: flex; min-height: 100vh; }

main.app-content {
  flex: 1;
  min-width: 0;
  height: 100vh;
  max-height: 100vh;
  padding: 0.2rem 0.35rem 0.35rem;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  transition: margin-left 0.25s ease;
}

main.app-content::-webkit-scrollbar { width: 5px; }
main.app-content::-webkit-scrollbar-track { background: transparent; }
main.app-content::-webkit-scrollbar-thumb { background: rgba(100, 116, 139, 0.25); border-radius: 3px; }
main.app-content::-webkit-scrollbar-thumb:hover { background: rgba(100, 116, 139, 0.45); }
main.app-content.with-nav { margin-left: 0; }

@media (max-width: 768px) {
  main.app-content.with-nav { padding-top: 4.5rem; }
}
main.app-content.nav-open { margin-left: var(--sidebar-w-open); }

/* ── Hamburger ── */
.mobile-toggle {
  display: flex; align-items: center; justify-content: center;
  position: fixed; top: 0.65rem; left: 0.65rem; z-index: 1100;
  width: 44px; height: 44px; border-radius: 12px;
  background: rgba(255,255,255,0.95); border: 1px solid #e2e8f0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1); cursor: pointer;
  color: #1e293b; padding: 0;
}
.mobile-toggle i { font-size: 1.5rem; }
.mobile-toggle:hover { color: #3b6b2e; box-shadow: 0 2px 12px rgba(0,0,0,0.12); }

/* ── Backdrop ── */
.sidebar-backdrop {
  display: block; position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.35);
}

/* ── Sidebar ── */
.sidebar {
  position: fixed; top: 0; left: 0; height: 100vh;
  width: var(--sidebar-w-open); z-index: 1000;
  display: flex; flex-direction: column;
  padding: 3.8rem 0.5rem 1rem;
  background: #ffffff;
  box-shadow: 4px 0 20px rgba(0,0,0,0.08);
  border-right: 1px solid #e2e8f0;
  transform: translateX(calc(-1 * var(--sidebar-w-open)));
  transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
  will-change: transform;
}
.sidebar--open { transform: translateX(0); }

/* ── Sidebar nav ── */
.sidebar-nav {
  display: flex; flex-direction: column;
  gap: 0.1rem; flex: 1;
  overflow-y: auto; overflow-x: hidden;
  width: 100%;
  scrollbar-width: none;
}
.sidebar-nav::-webkit-scrollbar { display: none; }

/* ── Module group ── */
.mod-group { width: 100%; }

.mod-header {
  display: flex; align-items: center; width: 100%; gap: 0;
  padding: 0.55rem 0.6rem; border-radius: 10px; border: none;
  background: transparent; color: #475569;
  font-weight: 600; font-size: 0.82rem;
  cursor: pointer; white-space: nowrap;
  letter-spacing: 0.03em; text-transform: uppercase;
  transition: background 0.15s, color 0.15s;
}
.mod-header:hover { background: rgba(59,107,46,0.06); color: #1e293b; }
.mod-header i:first-child { font-size: 1.1rem; width: 30px; flex-shrink: 0; text-align: center; }
.mod-header span { flex: 1; margin-left: 0.6rem; }
.mod-chevron { font-size: 0.7rem !important; width: auto !important; color: #94a3b8; transition: transform 0.2s; }

/* ── Sidebar collapse transition ── */
.sidebar-collapse-enter-active {
  animation: sidebar-expand 0.22s ease;
  overflow: hidden;
}
.sidebar-collapse-leave-active {
  animation: sidebar-expand 0.18s ease reverse;
  overflow: hidden;
}
@keyframes sidebar-expand {
  from { max-height: 0; opacity: 0; }
  to   { max-height: 400px; opacity: 1; }
}

.mod-links {
  display: flex; flex-direction: column; gap: 0.05rem;
  padding-left: 0.5rem; margin-bottom: 0.25rem;
}

.mod-links a, .mod-link-flat {
  display: flex; align-items: center; width: 100%; gap: 0;
  padding: 0.5rem 0.55rem; border-radius: 8px;
  color: #64748b; text-decoration: none;
  font-weight: 500; font-size: 0.85rem;
  white-space: nowrap; background: transparent;
  transition: background 0.15s, color 0.15s;
}
.mod-links a i, .mod-link-flat i {
  font-size: 1.05rem; flex-shrink: 0; width: 28px; text-align: center;
}
.mod-links a:hover, .mod-link-flat:hover {
  background: rgba(59,107,46,0.07); color: #1e293b;
}
.mod-links a.router-link-active, .mod-link-flat.router-link-active {
  background: rgba(59,107,46,0.11); color: #3b6b2e; font-weight: 600;
}

.mod-group--admin { margin-top: 0.25rem; border-top: 1px solid #f1f5f9; padding-top: 0.25rem; }
.mod-link-flat { border-radius: 10px; }

.nav-label { flex: 1; overflow: hidden; text-overflow: ellipsis; margin-left: 0.6rem; }

/* ── Bottom actions ── */
.sidebar-bottom-actions {
  display: flex; flex-direction: column; gap: 0.1rem; width: 100%;
  border-top: 1px solid #f1f5f9; padding-top: 0.5rem; margin-top: 0.5rem;
}

.sidebar-logout, .sidebar-manual-btn {
  display: flex; align-items: center; width: 100%; gap: 0;
  padding: 0.55rem 0.6rem; border-radius: 10px; border: none;
  background: transparent; font-weight: 500; font-size: 0.85rem;
  cursor: pointer; white-space: nowrap; box-shadow: none;
  transition: background 0.15s, color 0.15s;
}
.sidebar-logout { color: #64748b; }
.sidebar-logout:hover { background: rgba(220,38,38,0.07); color: #dc2626; }
.sidebar-logout i, .sidebar-manual-btn i { font-size: 1.1rem; flex-shrink: 0; width: 28px; text-align: center; }

.sidebar-manual-btn { display: none; color: #64748b; }
.sidebar-manual-btn:hover { background: rgba(59,107,46,0.07); color: #1e293b; }

@media (max-width: 768px) {
  main.app-content.nav-open { margin-left: 0; }
  .sidebar-manual-btn { display: flex; }
}
</style>
