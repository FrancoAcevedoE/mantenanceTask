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

const currentUser = computed(() => {
  route.fullPath
  return getStoredUser()
})

const showNav = computed(() => {
  route.fullPath
  return route.name !== 'LogUser' && Boolean(sessionStorage.getItem('token'))
})

const isAdmin = computed(() => currentUser.value?.role === 'admin')
const isCrmRole = computed(() => ['admin_ventas', 'vendedor'].includes(currentUser.value?.role))
const canViewDashboard = computed(() => ['admin', 'operario', 'supervisor'].includes(currentUser.value?.role))
const canViewNewMachine = computed(() => ['admin'].includes(currentUser.value?.role))
const canViewNew = computed(() => ['admin', 'operario'].includes(currentUser.value?.role))
const canViewSeller = computed(() => ['admin', 'admin_ventas', 'vendedor'].includes(currentUser.value?.role))
const canViewHistory = computed(() => !['vendedor', 'admin_ventas'].includes(currentUser.value?.role))
const canViewNotifications = computed(() => Boolean(currentUser.value?.role))

const mobileOpen = ref(false)
const closeMobile = () => { mobileOpen.value = false }

const logout = async () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  notificationsStore.reset()
  closeMobile()
  await router.push('/logUser')
}

const syncNotifications = async () => {
  if (showNav.value) {
    await notificationsStore.initialize()
    return
  }
  notificationsStore.reset()
}

const setBodyTheme = (theme) => {
  document.body.classList.remove('bg-login', 'bg-app', 'bg-dashboard', 'bg-notifications')
  if (theme) document.body.classList.add(theme)
}

watch(() => route.meta?.bodyClass, (theme) => { setBodyTheme(theme) }, { immediate: true })

onMounted(() => { syncNotifications().catch(() => {}) })
watch(() => route.fullPath, () => { syncNotifications().catch(() => {}) })
onBeforeUnmount(() => { notificationsStore.stop() })
</script>

<template>
  <NotificationBell v-if="showNav" />
  <UserManual v-if="showNav" />

  <div v-if="showNav && mobileOpen" class="sidebar-backdrop" @click="closeMobile" />

  <button v-if="showNav" class="mobile-toggle" @click="mobileOpen = !mobileOpen" type="button">
    <i :class="mobileOpen ? 'bi bi-x' : 'bi bi-list'"></i>
  </button>

  <aside v-if="showNav" :class="['sidebar', { 'sidebar--open': mobileOpen }]">
    <nav class="sidebar-nav">
      <router-link v-if="canViewDashboard" to="/dashboard" @click="closeMobile">
        <i class="bi bi-bar-chart-fill"></i>
        <span class="nav-label">Dashboard</span>
      </router-link>
      <router-link v-if="canViewNew" to="/new" @click="closeMobile">
        <i class="bi bi-wrench-adjustable-circle"></i>
        <span class="nav-label">Nuevo trabajo</span>
      </router-link>
      <router-link v-if="canViewHistory" to="/history" @click="closeMobile">
        <i class="bi bi-clock-history"></i>
        <span class="nav-label">Historial</span>
      </router-link>
      <router-link v-if="canViewNotifications" to="/notifications-history" @click="closeMobile">
        <i class="bi bi-bell"></i>
        <span class="nav-label">Notificaciones</span>
      </router-link>
      <router-link v-if="canViewSeller" to="/inventory" @click="closeMobile">
        <i class="bi bi-box-seam"></i>
        <span class="nav-label">Inventario</span>
      </router-link>
      <router-link v-if="canViewSeller" to="/crm" @click="closeMobile">
        <i class="bi bi-graph-up-arrow"></i>
        <span class="nav-label">CRM</span>
      </router-link>
      <router-link v-if="canViewNewMachine" to="/newMachine" @click="closeMobile">
        <i class="bi bi-building-add"></i>
        <span class="nav-label">Nueva máquina</span>
      </router-link>
      <router-link v-if="isAdmin || currentUser?.role === 'admin_ventas'" to="/adminView" @click="closeMobile">
        <i class="bi bi-person-plus-fill"></i>
        <span class="nav-label">Usuarios</span>
      </router-link>
    </nav>

    <button class="sidebar-logout" @click="logout" type="button">
      <i class="bi bi-box-arrow-right"></i>
      <span class="nav-label">Cerrar sesión</span>
    </button>
  </aside>

  <main :class="['app-content', { 'with-nav': showNav, 'nav-open': showNav && mobileOpen }]">
    <router-view />
  </main>
</template>

<style>
:root {
  --sidebar-w-open: 240px;
}

body.bg-login { background: linear-gradient(180deg, rgb(248, 248, 252), rgb(69, 82, 28)); }
body.bg-app,
body.bg-dashboard,
body.bg-notifications { background: rgb(103, 111, 62); }

html, body, #app {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

html, body {
  overflow-x: hidden;
  max-width: 100%;
}

body {
  margin: 0;
  padding: 0;
  background: var(--color-bg, rgb(103, 111, 62));
  color: var(--color-text, #21321A);
  font-family: 'Inter', system-ui, -apple-system, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

#app {
  display: flex;
  min-height: 100vh;
}

/* ── Contenido principal ── */

main.app-content {
  flex: 1;
  min-width: 0;
  height: 100vh;
  padding: 0.2rem 0.35rem 0.35rem;
  background: transparent;
  overflow-y: auto;
  overflow-x: hidden;
  transition: margin-left 0.25s ease;
}

main.app-content.with-nav {
  margin-left: 0;
}

main.app-content.nav-open {
  margin-left: var(--sidebar-w-open);
}

/* ── Hamburger toggle — siempre visible ── */

.mobile-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0.65rem;
  left: 0.65rem;
  z-index: 1100;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.93);
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  cursor: pointer;
  color: var(--color-text, #2d3d24);
  padding: 0;
}

.mobile-toggle i { font-size: 1.5rem; }
.mobile-toggle:hover { transform: none; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18); }

/* ── Backdrop ── */

.sidebar-backdrop {
  display: block;
  position: fixed;
  inset: 0;
  z-index: 999;
  background: rgba(0, 0, 0, 0.35);
}

/* ── Sidebar: drawer que se desliza desde la izquierda ── */

.sidebar {
  position: fixed;
  top: 0;
  left: calc(-1 * var(--sidebar-w-open));
  height: 100vh;
  width: var(--sidebar-w-open);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 4rem 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  transition: left 0.25s ease;
}

.sidebar--open { left: 0; }

/* ── Nav links ── */

.sidebar-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  flex: 1;
  overflow: visible;
  width: 100%;
}

.sidebar-nav a {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0;
  padding: 0.7rem 0.6rem;
  border-radius: 14px;
  color: #767676;
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  background: transparent;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.sidebar-nav a i {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

.sidebar-nav a:hover {
  background: rgba(107, 142, 58, 0.1);
  color: var(--color-text, #2d3d24);
  box-shadow: none;
}

.sidebar-nav a.router-link-active {
  background: rgba(107, 142, 58, 0.16);
  color: #2c2c2c;
}

.sidebar-nav a.router-link-active:hover {
  background: rgba(107, 142, 58, 0.2);
  color: #2c2c2c;
}

/* ── Labels: siempre visibles en el drawer ── */

.nav-label {
  max-width: none;
  flex: 1;
  overflow: visible;
  opacity: 1;
  margin-left: 0.75rem;
  white-space: nowrap;
}

/* ── Logout ── */

.sidebar-logout {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 0;
  padding: 0.7rem 0.6rem;
  border-radius: 14px;
  border: none;
  background: transparent;
  color: #767676;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.sidebar-logout:hover {
  background: rgba(220, 38, 38, 0.1);
  color: #dc2626;
}

.sidebar-logout i {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

/* ── Mobile: no desplazar contenido, solo overlay ── */
@media (max-width: 768px) {
  main.app-content.nav-open {
    margin-left: 0;
  }
}
</style>
