<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotificationBell from '@/components/NotificationBell.vue'
import UserManual from '@/components/UserManual.vue'
import GlobalSearch from '@/components/GlobalSearch.vue'
import PasswordConfirmDialog from '@/components/PasswordConfirmDialog.vue'
import { useNotificationsStore } from '@/stores/notifications'
import { useLocale } from '@/composables/useLocale'
import { useDarkModeToggle } from '@/composables/useDarkModeToggle'

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
const isDemoMode     = computed(() => currentUser.value?.isDemo === true)
const isAdmin        = computed(() => role.value === 'admin')
const canMantenim    = computed(() => ['admin', 'operario', 'supervisor'].includes(role.value))
const canVentas      = computed(() => ['admin', 'admin_ventas', 'vendedor'].includes(role.value))
const canCompras        = computed(() => ['admin', 'admin_compras', 'compras'].includes(role.value))
const canProduccion     = computed(() => ['admin', 'produccion'].includes(role.value))
const canMarketingOnly  = computed(() => ['marketing', 'admin_marketing'].includes(role.value))
const canNewWork     = computed(() => ['admin', 'operario'].includes(role.value))
const canHistory     = computed(() => !['vendedor', 'admin_ventas'].includes(role.value))
const canNewMachine  = computed(() => isAdmin.value)
const canUsers       = computed(() => ['admin', 'admin_ventas'].includes(role.value))

// ── Módulos colapsables ─────────────────────────────────────────────────────
const MANTENIM_PATHS   = ['/dashboard', '/new', '/history', '/notifications-history', '/newMachine']
const VENTAS_PATHS     = ['/inventory', '/product', '/bulk-price', '/stock-management', '/inv-dashboard', '/product-log', '/product-groups', '/color-catalog', '/crm', '/marketing']
const COMPRAS_PATHS    = ['/compras']
const PRODUCCION_PATHS = ['/produccion']
const MARKETING_PATHS  = ['/marketing', '/notifications-history', '/adminView']

function pathInGroup(paths) {
  return paths.some(p => route.path === p || route.path.startsWith(p + '/') || route.path.startsWith(p))
}

const openMantenim   = ref(false)
const openVentas     = ref(false)
const openCompras    = ref(false)
const openProduccion = ref(false)
const openMarketing  = ref(false)

const anyOpen = computed(() =>
  openMantenim.value || openVentas.value || openCompras.value ||
  openProduccion.value || openMarketing.value
)

function autoOpenModules() {
  if (pathInGroup(MANTENIM_PATHS))   openMantenim.value   = true
  if (pathInGroup(VENTAS_PATHS))     openVentas.value     = true
  if (pathInGroup(COMPRAS_PATHS))    openCompras.value    = true
  if (pathInGroup(PRODUCCION_PATHS)) openProduccion.value = true
  if (pathInGroup(MARKETING_PATHS))  openMarketing.value  = true
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

const { darkMode, toggleDark } = useDarkModeToggle()

// Locale
const { locale, toggleLocale } = useLocale()

const nav = computed(() => locale.value === 'pt' ? {
  maintenance: 'Manutenção', newJob: 'Novo trabalho', history: 'Histórico',
  notifications: 'Notificações', newMachine: 'Nova máquina',
  sales: 'Vendas', crm: 'CRM', inventory: 'Inventário',
  purchases: 'Compras', rawMaterials: 'Matérias-primas', suppliers: 'Fornecedores',
  users: 'Usuários', logout: 'Sair', manual: 'Manual do usuário',
  darkMode: 'Modo escuro', lightMode: 'Modo claro', language: 'ES',
} : {
  maintenance: 'Mantenimiento', newJob: 'Nuevo trabajo', history: 'Historial',
  notifications: 'Notificaciones', newMachine: 'Nueva máquina',
  sales: 'Ventas', crm: 'CRM', inventory: 'Inventario',
  purchases: 'Compras', rawMaterials: 'Materias primas', suppliers: 'Proveedores',
  users: 'Usuarios', logout: 'Cerrar sesión', manual: 'Manual de usuario',
  darkMode: 'Modo oscuro', lightMode: 'Modo claro', language: 'PT',
})

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
  <GlobalSearch v-if="showNav" ref="globalSearch" />
  <PasswordConfirmDialog />
  <div v-if="showNav && mobileOpen" class="sidebar-backdrop" @click="closeMobile" />
  <button v-if="showNav" class="mobile-toggle" @click="mobileOpen = !mobileOpen" type="button" :aria-label="locale === 'pt' ? 'Abrir menu de navegação' : 'Abrir menú de navegación'">
    <i :class="mobileOpen ? 'bi bi-x' : 'bi bi-list'"></i>
  </button>

  <aside v-if="showNav" :class="['sidebar', { 'sidebar--open': mobileOpen }]">
    <nav :class="['sidebar-nav', { 'has-open': anyOpen }]">

      <!-- ── MANTENIMIENTO ── -->
      <div v-if="canMantenim" :class="['mod-group', { 'mod-group--muted': anyOpen && !openMantenim }]">
        <button class="mod-header" @click="openMantenim = !openMantenim">
          <i class="bi bi-wrench-adjustable-circle"></i>
          <span>{{ nav.maintenance }}</span>
          <i :class="['mod-chevron bi', openMantenim ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
        <Transition name="sidebar-collapse">
          <div v-show="openMantenim" class="mod-links">
            <router-link to="/dashboard" @click="closeMobile">
              <i class="bi bi-bar-chart-fill"></i><span class="nav-label">Dashboard</span>
            </router-link>
            <router-link v-if="canNewWork" to="/new" @click="closeMobile">
              <i class="bi bi-plus-circle"></i><span class="nav-label">{{ nav.newJob }}</span>
            </router-link>
            <router-link v-if="canHistory" to="/history" @click="closeMobile">
              <i class="bi bi-clock-history"></i><span class="nav-label">{{ nav.history }}</span>
            </router-link>
            <router-link to="/notifications-history" @click="closeMobile">
              <i class="bi bi-bell"></i><span class="nav-label">{{ nav.notifications }}</span>
            </router-link>
            <router-link v-if="canNewMachine" to="/newMachine" @click="closeMobile">
              <i class="bi bi-building-add"></i><span class="nav-label">{{ nav.newMachine }}</span>
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- ── VENTAS ── -->
      <div v-if="canVentas" :class="['mod-group', { 'mod-group--muted': anyOpen && !openVentas }]">
        <button class="mod-header" @click="openVentas = !openVentas">
          <i class="bi bi-graph-up-arrow"></i>
          <span>{{ nav.sales }}</span>
          <i :class="['mod-chevron bi', openVentas ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
        <Transition name="sidebar-collapse">
          <div v-show="openVentas" class="mod-links">
            <router-link to="/crm" @click="closeMobile">
              <i class="bi bi-people-fill"></i><span class="nav-label">{{ nav.crm }}</span>
            </router-link>
            <router-link to="/marketing" @click="closeMobile">
              <i class="bi bi-megaphone-fill"></i><span class="nav-label">Marketing</span>
            </router-link>
            <router-link to="/inventory" @click="closeMobile">
              <i class="bi bi-box-seam"></i><span class="nav-label">{{ nav.inventory }}</span>
            </router-link>
            <router-link to="/notifications-history" @click="closeMobile">
              <i class="bi bi-bell"></i><span class="nav-label">{{ nav.notifications }}</span>
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- ── COMPRAS ── -->
      <div v-if="canCompras" :class="['mod-group', { 'mod-group--muted': anyOpen && !openCompras }]">
        <button class="mod-header" @click="openCompras = !openCompras">
          <i class="bi bi-cart3"></i>
          <span>{{ nav.purchases }}</span>
          <i :class="['mod-chevron bi', openCompras ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
        <Transition name="sidebar-collapse">
          <div v-show="openCompras" class="mod-links">
            <router-link to="/compras/materias-primas" @click="closeMobile">
              <i class="bi bi-boxes"></i><span class="nav-label">{{ nav.rawMaterials }}</span>
            </router-link>
            <router-link to="/compras/proveedores" @click="closeMobile">
              <i class="bi bi-building"></i><span class="nav-label">{{ nav.suppliers }}</span>
            </router-link>
            <router-link to="/notifications-history" @click="closeMobile">
              <i class="bi bi-bell"></i><span class="nav-label">{{ nav.notifications }}</span>
            </router-link>
          </div>
        </Transition>
      </div>

      <!-- ── MARKETING ── (solo para roles marketing puros) -->
      <div v-if="canMarketingOnly" :class="['mod-group', { 'mod-group--muted': anyOpen && !openMarketing }]">
        <button class="mod-header" @click="openMarketing = !openMarketing">
          <i class="bi bi-megaphone-fill"></i>
          <span>Marketing</span>
          <i :class="['mod-chevron bi', openMarketing ? 'bi-chevron-up' : 'bi-chevron-down']"></i>
        </button>
        <Transition name="sidebar-collapse">
          <div v-show="openMarketing" class="mod-links">
            <router-link to="/marketing" @click="closeMobile">
              <i class="bi bi-megaphone-fill"></i><span class="nav-label">Marketing</span>
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

      <!-- ── ADMIN link para admin_marketing ── -->
      <div v-if="canMarketingOnly && role === 'admin_marketing'" :class="['mod-group mod-group--admin', { 'mod-group--muted': anyOpen }]">
        <router-link to="/adminView" @click="closeMobile" class="mod-link-flat">
          <i class="bi bi-person-plus-fill"></i><span class="nav-label">Usuarios</span>
        </router-link>
      </div>

      <!-- ── ADMIN ── -->
      <div v-if="canUsers" :class="['mod-group mod-group--admin', { 'mod-group--muted': anyOpen }]">
        <router-link to="/adminView" @click="closeMobile" class="mod-link-flat">
          <i class="bi bi-person-plus-fill"></i><span class="nav-label">{{ nav.users }}</span>
        </router-link>
      </div>

    </nav>

    <div class="sidebar-bottom-actions">
      <button class="sidebar-search-btn" @click="$refs.globalSearch.openSearch(); closeMobile()" type="button">
        <i class="bi bi-search"></i>
        <span class="nav-label">Buscar <kbd>Ctrl+K</kbd></span>
      </button>
      <button class="sidebar-manual-btn" @click="$refs.manual.open = true; closeMobile()" type="button">
        <i class="bi bi-question-circle-fill"></i>
        <span class="nav-label">{{ nav.manual }}</span>
      </button>
      <button class="sidebar-dark-btn" @click="toggleDark" type="button">
        <i :class="darkMode ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
        <span class="nav-label">{{ darkMode ? nav.lightMode : nav.darkMode }}</span>
      </button>
      <button class="sidebar-lang-btn" @click="toggleLocale" type="button">
        <i class="bi bi-globe2"></i>
        <span class="nav-label">{{ nav.language }}</span>
      </button>
      <button class="sidebar-logout" @click="logout" type="button">
        <i class="bi bi-box-arrow-right"></i>
        <span class="nav-label">{{ nav.logout }}</span>
      </button>
    </div>
  </aside>

  <main :class="['app-content', { 'with-nav': showNav, 'nav-open': showNav && mobileOpen }]">
    <div v-if="isDemoMode && showNav" class="demo-banner">
      <i class="bi bi-flask-fill"></i>
      <span>Modo demo — los cambios no se guardan y se revierten al cerrar sesión</span>
    </div>
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
.mod-group {
  width: 100%;
  opacity: 1;
  border-radius: 10px;
  transition: opacity 0.2s ease, background 0.2s ease;
}
.mod-group--muted { opacity: 0.22; }
.has-open .mod-group:not(.mod-group--muted) .mod-header {
  background: rgba(59,107,46,0.09);
  color: #1e293b;
}

[data-theme="dark"] .has-open .mod-group:not(.mod-group--muted) .mod-header {
  background: rgba(255,102,0,0.13);
  color: #ffffff;
}

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

.sidebar-logout, .sidebar-manual-btn, .sidebar-search-btn {
  display: flex; align-items: center; width: 100%; gap: 0;
  padding: 0.55rem 0.6rem; border-radius: 10px; border: none;
  background: transparent; font-weight: 500; font-size: 0.85rem;
  cursor: pointer; white-space: nowrap; box-shadow: none;
  transition: background 0.15s, color 0.15s;
}
.sidebar-logout { color: #64748b; }
.sidebar-logout:hover { background: rgba(220,38,38,0.07); color: #dc2626; }
.sidebar-logout i, .sidebar-manual-btn i, .sidebar-search-btn i { font-size: 1.1rem; flex-shrink: 0; width: 28px; text-align: center; }

.sidebar-manual-btn { display: none; color: #64748b; }
.sidebar-manual-btn:hover { background: rgba(59,107,46,0.07); color: #1e293b; }

.sidebar-search-btn { color: #64748b; }
.sidebar-search-btn:hover { background: rgba(59,107,46,0.07); color: #3b6b2e; }
.sidebar-search-btn .nav-label { display: flex; align-items: center; gap: 0.5rem; }
.sidebar-search-btn kbd {
  font-size: 0.65rem; font-weight: 700; color: #94a3b8;
  background: #f1f5f9; border: 1px solid #e2e8f0;
  border-radius: 4px; padding: 0 4px; line-height: 1.6;
  font-family: inherit; text-transform: none;
}

.sidebar-dark-btn, .sidebar-lang-btn {
  display: flex; align-items: center; width: 100%; gap: 0;
  padding: 0.55rem 0.6rem; border-radius: 10px; border: none;
  background: transparent; font-weight: 500; font-size: 0.85rem;
  cursor: pointer; white-space: nowrap; box-shadow: none;
  color: #64748b; transition: background 0.15s, color 0.15s;
}
.sidebar-dark-btn i, .sidebar-lang-btn i { font-size: 1.1rem; flex-shrink: 0; width: 28px; text-align: center; }
.sidebar-dark-btn:hover, .sidebar-lang-btn:hover { background: rgba(59,107,46,0.07); color: #1e293b; }

@media (max-width: 768px) {
  main.app-content.nav-open { margin-left: 0; }
  .sidebar-manual-btn { display: flex; }
}

/* ── DARK MODE ──────────────────────────────────────────────────── */
:root[data-theme="dark"] {
  --color-bg: #070b14;
  --color-surface: rgba(255,255,255,0.05);
  --color-surface-2: rgba(255,255,255,0.03);
  --color-border: rgba(255,255,255,0.08);
  --color-text: #ffffff;
  --color-muted: rgba(255,255,255,0.45);
  --color-primary: #FF6600;
  --color-primary-hover: #ff4400;
  --sidebar-bg: rgba(7,11,20,0.88);
  --sidebar-text: rgba(255,255,255,0.65);
  --sidebar-accent: #FF6600;
}

/* body — same aurora gradient as style.css, !important to beat inline class styles */
[data-theme="dark"] body,
[data-theme="dark"] body.bg-login,
[data-theme="dark"] body.bg-app,
[data-theme="dark"] body.bg-dashboard,
[data-theme="dark"] body.bg-notifications,
[data-theme="dark"] body.bg-maintenance {
  background:
    radial-gradient(ellipse at 15% 15%, rgba(120,50,220,0.18) 0%, transparent 55%),
    radial-gradient(ellipse at 85% 85%, rgba(255,102,0,0.14) 0%, transparent 55%),
    radial-gradient(ellipse at 50% 100%, rgba(30,60,180,0.12) 0%, transparent 50%),
    #070b14 !important;
}

/* ── Sidebar: glassmorphism dark ── */
[data-theme="dark"] .sidebar {
  background: rgba(7,11,20,0.82);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
  border-right: 1px solid rgba(255,255,255,0.06);
  box-shadow: 4px 0 32px rgba(0,0,0,0.5);
}

[data-theme="dark"] .mod-header { color: rgba(255,255,255,0.6); }
[data-theme="dark"] .mod-header:hover { background: rgba(255,102,0,0.1); color: #ffffff; }
[data-theme="dark"] .mod-chevron { color: rgba(255,255,255,0.35); }

[data-theme="dark"] .mod-links a,
[data-theme="dark"] .mod-link-flat { color: rgba(255,255,255,0.5) !important; }
[data-theme="dark"] .mod-links a span,
[data-theme="dark"] .mod-links a i,
[data-theme="dark"] .mod-link-flat span,
[data-theme="dark"] .mod-link-flat i { color: rgba(255,255,255,0.5) !important; }

[data-theme="dark"] .mod-links a:hover,
[data-theme="dark"] .mod-link-flat:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9) !important; }
[data-theme="dark"] .mod-links a:hover span,
[data-theme="dark"] .mod-links a:hover i,
[data-theme="dark"] .mod-link-flat:hover span,
[data-theme="dark"] .mod-link-flat:hover i { color: rgba(255,255,255,0.9) !important; }

[data-theme="dark"] .mod-links a.router-link-active,
[data-theme="dark"] .mod-link-flat.router-link-active {
  background: rgba(255,102,0,0.15);
  color: #FF8C42 !important;
  border-left: 2px solid #FF6600;
}
[data-theme="dark"] .mod-links a.router-link-active span,
[data-theme="dark"] .mod-links a.router-link-active i,
[data-theme="dark"] .mod-link-flat.router-link-active span,
[data-theme="dark"] .mod-link-flat.router-link-active i { color: #FF8C42 !important; }

[data-theme="dark"] .mod-group--admin { border-top-color: rgba(255,255,255,0.07); }
[data-theme="dark"] .sidebar-bottom-actions { border-top-color: rgba(255,255,255,0.07); }

[data-theme="dark"] .sidebar-logout { color: rgba(255,255,255,0.5); }
[data-theme="dark"] .sidebar-logout:hover { background: rgba(239,68,68,0.12); color: #fc8181; }

[data-theme="dark"] .sidebar-manual-btn,
[data-theme="dark"] .sidebar-dark-btn,
[data-theme="dark"] .sidebar-lang-btn,
[data-theme="dark"] .sidebar-search-btn { color: rgba(255,255,255,0.5); }

[data-theme="dark"] .sidebar-manual-btn:hover,
[data-theme="dark"] .sidebar-dark-btn:hover,
[data-theme="dark"] .sidebar-lang-btn:hover,
[data-theme="dark"] .sidebar-search-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.9); }
[data-theme="dark"] .sidebar-search-btn kbd { background: rgba(255,255,255,0.07); border-color: rgba(255,255,255,0.1); color: rgba(255,255,255,0.35); }

/* ── Mobile toggle: glassmorphism ── */
[data-theme="dark"] .mobile-toggle {
  background: rgba(7,11,20,0.8);
  backdrop-filter: blur(12px);
  border-color: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.85);
}
[data-theme="dark"] .mobile-toggle:hover { color: #FF6600; }

[data-theme="dark"] main.app-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); }

/* ── Demo mode banner ── */
.demo-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(234,179,8,0.12);
  border-bottom: 1px solid rgba(234,179,8,0.3);
  color: #92400e;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.45rem 1rem;
  letter-spacing: 0.02em;
}
.demo-banner i { font-size: 0.85rem; flex-shrink: 0; }
[data-theme="dark"] .demo-banner {
  background: rgba(234,179,8,0.1);
  border-bottom-color: rgba(234,179,8,0.2);
  color: #fde68a;
}
</style>
