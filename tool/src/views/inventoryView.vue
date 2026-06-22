<template>
  <div class="page-container">
    <div class="box">
      <h2>Inventario</h2>
      <p class="placeholder-text">Próximamente...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'InventoryView'
}
</script>

<style scoped>
.page-container {
  padding: 1rem;
}

.box {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.placeholder-text {
  color: #6c757d;
  font-style: italic;
  margin-top: 1rem;
}
</style>
