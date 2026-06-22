<script setup>
import { ref, computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import NotificationBell from '@/components/NotificationBell.vue'
import { useNotificationsStore } from '@/stores/notifications'

const route = useRoute()
const router = useRouter()
const notificationsStore = useNotificationsStore()

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem('user')
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
  return route.name !== 'LogUser' && Boolean(localStorage.getItem('token'))
})

const isAdmin = computed(() => currentUser.value?.role === 'admin')
const canViewNewMachine = computed(() => ['admin'].includes(currentUser.value?.role))
const canViewNew = computed(() => ['admin', 'operario'].includes(currentUser.value?.role))
const canViewSeller = computed(() => ['admin', 'vendedor'].includes(currentUser.value?.role))
const canViewHistory = computed(() => currentUser.value?.role !== 'vendedor')
const canViewNotifications = computed(() => currentUser.value?.role !== 'vendedor')

const mobileOpen = ref(false)
const closeMobile = () => { mobileOpen.value = false }

const logout = async () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
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

  <div v-if="showNav && mobileOpen" class="sidebar-backdrop" @click="closeMobile" />

  <button v-if="showNav" class="mobile-toggle" @click="mobileOpen = !mobileOpen" type="button">
    <i :class="mobileOpen ? 'bi bi-x' : 'bi bi-list'"></i>
  </button>

  <aside v-if="showNav" :class="['sidebar', { 'sidebar--open': mobileOpen }]">
    <nav class="sidebar-nav">
      <router-link to="/dashboard" @click="closeMobile">
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
      <router-link v-if="canViewSeller" to="/seller" @click="closeMobile">
        <i class="bi bi-calculator"></i>
        <span class="nav-label">Cotizaciones</span>
      </router-link>
      <router-link v-if="canViewSeller" to="/inventory" @click="closeMobile">
        <i class="bi bi-box-seam"></i>
        <span class="nav-label">Inventario</span>
      </router-link>
      <router-link v-if="canViewNewMachine" to="/newMachine" @click="closeMobile">
        <i class="bi bi-building-add"></i>
        <span class="nav-label">Nueva máquina</span>
      </router-link>
      <router-link v-if="isAdmin" to="/adminView" @click="closeMobile">
        <i class="bi bi-person-plus-fill"></i>
        <span class="nav-label">Usuarios</span>
      </router-link>
    </nav>

    <button class="sidebar-logout" @click="logout" type="button">
      <i class="bi bi-box-arrow-right"></i>
      <span class="nav-label">Cerrar sesión</span>
    </button>
  </aside>

  <main :class="['app-content', { 'with-nav': showNav }]">
    <router-view />
  </main>
</template>

<style>
:root {
  --sidebar-w: 60px;
  --sidebar-w-open: 240px;
}

body.bg-login { background: linear-gradient(180deg, rgb(248, 248, 252), rgb(69, 82, 28)); }
body.bg-app,
body.bg-dashboard,
body.bg-notifications { background: rgb(103, 111, 62); }

html, body, #app { min-height: 100vh; }

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
  display: block;
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  padding: 1rem;
  background: transparent;
  overflow-x: hidden;
}

main.app-content.with-nav {
  margin-left: var(--sidebar-w);
}

/* ── Sidebar: sin fondo, transparente ── */

.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: var(--sidebar-w);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 1rem 0.5rem 1rem;
  background: transparent;
  overflow: visible;
}

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
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 0.7rem 0.6rem;
  border-radius: 14px;
  color: rgba(255, 255, 255, 0.82);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9rem;
  white-space: nowrap;
  background: transparent;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, padding 0.2s ease;
}

.sidebar-nav a i {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

.sidebar-nav a:hover {
  background: rgba(255, 255, 255, 0.93);
  color: #2d3d24;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.14);
  transform: scale(1.05);
  padding: 0.75rem 0.85rem;
}

.sidebar-nav a.router-link-active {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
}

.sidebar-nav a.router-link-active:hover {
  background: rgba(255, 255, 255, 0.93);
  color: #2d3d24;
}

/* ── Labels: se despliegan individualmente en hover ── */

.nav-label {
  max-width: 0;
  opacity: 0;
  overflow: hidden;
  margin-left: 0;
  transition: max-width 0.25s ease, opacity 0.18s ease, margin-left 0.22s ease;
}

.sidebar-nav a:hover .nav-label,
.sidebar-logout:hover .nav-label {
  max-width: 160px;
  opacity: 1;
  margin-left: 0.75rem;
}

/* ── Logout ── */

.sidebar-logout {
  display: inline-flex;
  align-items: center;
  gap: 0;
  padding: 0.7rem 0.6rem;
  border-radius: 14px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease, padding 0.2s ease;
}

.sidebar-logout:hover {
  background: rgba(220, 38, 38, 0.88);
  color: #fff;
  transform: scale(1.05);
  padding: 0.75rem 0.85rem;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.14);
}

.sidebar-logout i {
  font-size: 1.4rem;
  flex-shrink: 0;
  width: 32px;
  text-align: center;
}

/* ── Mobile toggle ── */

.mobile-toggle { display: none; }
.sidebar-backdrop { display: none; }

/* ── Responsive ≤768px: drawer con fondo ── */

@media (max-width: 768px) {
  main.app-content.with-nav {
    margin-left: 0;
    padding-top: 4rem;
  }

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

  .sidebar-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 999;
    background: rgba(0, 0, 0, 0.45);
  }

  /* Drawer fuera de pantalla por defecto */
  .sidebar {
    left: calc(-1 * var(--sidebar-w-open));
    width: var(--sidebar-w-open);
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18);
    overflow: hidden;
    padding-top: 1rem;
    transition: left 0.25s ease;
    align-items: flex-start;
  }

  .sidebar--open { left: 0; }

  /* En móvil los items ocupan todo el ancho del drawer */
  .sidebar-nav a {
    display: flex;
    width: 100%;
    color: #767676;
    background: transparent;
    box-shadow: none;
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

  /* Labels siempre visibles en el drawer */
  .sidebar .nav-label {
    max-width: none;
    flex: 1;
    overflow: visible;
    opacity: 1;
    margin-left: 0.75rem;
    white-space: nowrap;
  }

  .sidebar-logout {
    display: flex;
    width: 100%;
    color: #767676;
    background: transparent;
  }

  .sidebar-logout:hover {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }
}
</style>
