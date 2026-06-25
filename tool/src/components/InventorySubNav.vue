<template>
  <nav class="inv-subnav">
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
    <router-link to="/product-log" :class="{ active: isActive('/product-log') }">
      <i class="bi bi-journal-text"></i>
      <span>Registro</span>
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

function isActive(path) {
  if (path === '/inventory') return route.path === '/inventory'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.inv-subnav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
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
  background: rgba(107, 142, 58, 0.07);
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.inv-subnav a:hover {
  background: rgba(107, 142, 58, 0.14);
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
  .inv-subnav a span { display: none; }
  .inv-subnav a { padding: 0.55rem 0.85rem; }
  .inv-subnav a i { font-size: 1.15rem; }
}
</style>
