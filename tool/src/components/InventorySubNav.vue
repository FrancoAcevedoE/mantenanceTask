<template>
  <div class="subnav-wrap">
    <nav class="inv-subnav" ref="navRef">
      <router-link to="/inventory" :class="{ active: isActive('/inventory') }">
        <i class="bi bi-grid-3x3-gap"></i>
        <span>Productos</span>
      </router-link>
      <router-link to="/inv-dashboard" :class="{ active: isActive('/inv-dashboard') }">
        <i class="bi bi-bar-chart-line"></i>
        <span>Dashboard</span>
      </router-link>
      <router-link to="/stock-management" :class="{ active: isActive('/stock-management') }">
        <i class="bi bi-boxes"></i>
        <span>Stock</span>
      </router-link>
      <router-link to="/bulk-price" :class="{ active: isActive('/bulk-price') }">
        <i class="bi bi-tags"></i>
        <span>Precios masivos</span>
      </router-link>
      <router-link to="/product-groups" :class="{ active: isActive('/product-groups') }">
        <i class="bi bi-collection"></i>
        <span>Grupos</span>
      </router-link>
      <router-link to="/color-catalog" :class="{ active: isActive('/color-catalog') }">
        <i class="bi bi-palette"></i>
        <span>Colores</span>
      </router-link>
      <router-link to="/product-log" :class="{ active: isActive('/product-log') }">
        <i class="bi bi-journal-text"></i>
        <span>Registro</span>
      </router-link>
    </nav>
    <div class="scroll-fade" aria-hidden="true">
      <i class="bi bi-chevron-right"></i>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const navRef = ref(null)

function isActive(path) {
  if (path === '/inventory') return route.path === '/inventory'
  return route.path.startsWith(path)
}

onMounted(() => {
  const nav = navRef.value
  if (!nav) return
  const active = nav.querySelector('.active')
  if (active) active.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' })
})
</script>

<style scoped>
.subnav-wrap {
  position: relative;
  margin-bottom: 1.5rem;
}

.scroll-fade { display: none; }

.inv-subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(107, 142, 58, 0.15);
}

.inv-subnav a {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-muted);
  background: transparent;
  border: 1px solid transparent;
  transition: color 0.2s ease;
}

.inv-subnav a:hover {
  background: transparent;
  color: var(--color-text);
}

.inv-subnav a.active {
  background: var(--color-primary);
  color: #fff;
  border-color: transparent;
}

.inv-subnav a i {
  font-size: 1rem;
}

@media (max-width: 600px) {
  .subnav-wrap { overflow: hidden; }

  .inv-subnav {
    gap: 0.25rem;
    overflow-x: auto;
    flex-wrap: nowrap;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 0.75rem;
    scroll-behavior: smooth;
  }
  .inv-subnav::-webkit-scrollbar { display: none; }

  .inv-subnav a {
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.35rem 0.6rem;
    font-size: 0.62rem;
    text-align: center;
    flex-shrink: 0;
    border-radius: 10px;
    white-space: nowrap;
  }
  .inv-subnav a i { font-size: 1rem; }
  .inv-subnav a span { display: block; }

  .scroll-fade { display: none; }
}
</style>
