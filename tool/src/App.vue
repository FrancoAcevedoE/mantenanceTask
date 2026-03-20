<script setup>

</script>

<template>
  <nav>
    <router-link to="logUser"><i class="bi bi-box-arrow-in-right"></i></router-link>
    <router-link to="adminView"><i class="bi bi-person-plus-fill"></i></router-link>
      <router-link to="/newMachine"><i class="bi bi-building-add"></i></router-link>
    <router-link to="/new"><i class="bi bi-wrench-adjustable-circle"></i></router-link>
    <router-link to="/history"><i class="bi bi-clock-history"></i></router-link>
    <router-link to="/dashboard"><i class="bi bi-bar-chart-fill"></i></router-link>
  </nav>

  <!-- this is where the matched view will be rendered -->
  <main class="app-content">
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

.app-content {
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

nav a {
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

nav a i {
  font-size: 1.7rem;
}

nav a:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.35);
  text-decoration: none;
}

nav a.router-link-active {
  color: #2c2c2c;
  background: rgba(235, 235, 235, 0.95);
}

/* Responsive */
@media (max-width: 768px) {
  .app-content {
    padding-top: 4.2rem;
  }

  nav {
    width: calc(100% - 0.6rem);
    flex-wrap: wrap;
    gap: 0.4rem;
    padding: 0.3rem 0.45rem;
    border-radius: 0 0 16px 16px;
  }

  nav a {
    width: 46px;
    height: 46px;
  }

  nav a i {
    font-size: 1.45rem;
  }
}
</style>
