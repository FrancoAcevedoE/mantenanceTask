<script setup>

</script>

<template>
  <h1>You did it!</h1>
  <nav>
    <router-link to="/history">Historial</router-link>
    <router-link to="/new">Nuevo mantenimiento</router-link>
  </nav>

  <!-- this is where the matched view will be rendered -->
  <router-view />
</template>

<style>
/* global minimalist styling */
body {
  margin: 0;
  padding: 0;
  background: #fff;
  color: #000;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

nav {
  padding: 1rem;
  background: #f2f2f2;
  border-bottom: 1px solid #d1d1d1;
}

router-link {
  margin-right: 1rem;
  color: #000;
  text-decoration: none;
  font-weight: 500;
}

router-link:hover {
  text-decoration: underline;
}
</style>
