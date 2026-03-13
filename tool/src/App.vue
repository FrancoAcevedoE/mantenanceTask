<script setup>

</script>

<template>
  <nav>
    <router-link to="logUser">Login User</router-link>
    <router-link to="adminView">Crear Usuario</router-link>
    <router-link to="/history">Historial</router-link>
    <router-link to="/new">Nuevo mantenimiento</router-link>
    <router-link to="/newMachine">Nueva máquina</router-link>
  </nav>

  <!-- this is where the matched view will be rendered -->
  <router-view />
</template>

<style>
/* global minimalist styling */
body {
  margin: 0;
  padding: 0;
  background:#ffffff;
  /* background:#2E3D58; */
  color: #000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

nav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: #ffffff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.263);
}

nav a {
  display: inline-block;
  margin-right: 1rem;
  padding: 0.4rem 0.75rem;
  color: #929292;
  text-decoration: none;
  font-weight: 600;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

nav a:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
  text-decoration: none;
}

nav a.router-link-active {
  background: rgba(255, 255, 255, 0.15);
}
</style>
