<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

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

const logout = async () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  await router.push('/logUser')
}
</script>

<template>
  <nav v-if="showNav">
    <button type="button" class="nav-button" @click="logout">
      <i class="bi bi-box-arrow-right"></i>
    </button>
    <router-link v-if="isAdmin" to="/adminView"><i class="bi bi-person-plus-fill"></i></router-link>
      <router-link v-if="canViewNewMachine" to="/newMachine"><i class="bi bi-building-add"></i></router-link>
    <router-link v-if="canViewNew" to="/new"><i class="bi bi-wrench-adjustable-circle"></i></router-link>
    <router-link to="/history"><i class="bi bi-clock-history"></i></router-link>
    <router-link to="/dashboard"><i class="bi bi-bar-chart-fill"></i></router-link>
  </nav>

  <!-- this is where the matched view will be rendered -->
  <main :class="['app-content', { 'with-nav': showNav }]">
    <router-view />
  </main>
</template>

<style>
/* global minimalist styling */
body {
  margin: 0;
  padding: 0;
  background:#ffffff;
  /* background:#2E3D58; */
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

.app-content.with-nav {
  padding-top: 4.8rem;
}

nav {
  position: fixed;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  width: fit-content;
  max-width: calc(100% - 1rem);
  margin: 0;
  gap: 0.55rem;
  padding: 0.3rem 0.45rem;
  background: rgba(255, 255, 255, 0.96);
  border-radius: 0 0 18px 18px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.2);
}

nav::before {
  content: none;
}

nav::after {
  content: none;
}

nav a,
.nav-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  margin-right: 0;
  padding: 0;
  color: #929292;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

nav a i,
.nav-button i {
  font-size: 1.7rem;
}

nav a:hover,
.nav-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
  text-decoration: none;
}

.nav-button {
  cursor: pointer;
}

nav a.router-link-active {
  color: #2c2c2c;
  background: rgba(235, 235, 235, 0.95);
}

/* Responsive */
@media (max-width: 768px) {
  body {
    background-color: #0f172a;
    background-attachment: scroll !important;
    background-size: cover !important;
    background-position: center top !important;
  }

  .app-content.with-nav {
    padding-top: 4.2rem;
  }

  nav {
    width: fit-content;
    max-width: calc(100% - 0.6rem);
    flex-wrap: nowrap;
    gap: 0.32rem;
    padding: 0.28rem 0.32rem;
    border-radius: 0 0 16px 16px;
  }

  nav a,
  .nav-button {
    width: 42px;
    height: 42px;
  }

  nav a i,
  .nav-button i {
    font-size: 1.3rem;
  }
}
</style>
