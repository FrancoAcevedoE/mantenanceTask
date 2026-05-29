<template>
  <section class="design-preview">
    <div class="preview-hero card-hero">
      <div class="hero-top">
        <span class="chip">Nuevo estilo</span>
        <h1 class="preview-title">Panel de mantenimiento</h1>
        <p class="preview-copy">
          Un diseño amigable, limpio y enfocado en la operación rápida de tus mantenciones.
        </p>
      </div>

      <div class="hero-actions">
        <button class="btn-primary">Nueva mantención</button>
        <button class="btn-secondary">Ver reportes</button>
      </div>
    </div>

    <div class="preview-metrics">
      <article class="metric-card">
        <span class="metric-label">Mantenimientos</span>
        <strong>128</strong>
        <p>En el último mes</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Operarios</span>
        <strong>34</strong>
        <p>Activos</p>
      </article>
      <article class="metric-card">
        <span class="metric-label">Pendientes</span>
        <strong>12</strong>
        <p>Por completar</p>
      </article>
    </div>

    <div class="preview-summary cart-panel">
      <div class="summary-header">
        <div>
          <h3>Resumen rápido</h3>
          <p>Estados de equipos y próximas acciones.</p>
        </div>
        <span class="chip">En línea</span>
      </div>

      <div class="summary-row">
        <span>Operativas</span>
        <strong>58</strong>
      </div>
      <div class="summary-row">
        <span>Pendientes</span>
        <strong>12</strong>
      </div>
      <div class="summary-row">
        <span>Detenidas</span>
        <strong>4</strong>
      </div>
    </div>
  </section>
</template>

<script setup>
</script>

<style scoped>
.design-preview {
  width: 100%;
  max-width: 1100px;
  margin: 0 auto 2.5rem;
  display: grid;
  gap: 1.5rem;
}

.preview-hero {
  padding: 32px 28px;
}

.hero-top {
  display: grid;
  gap: 1rem;
  width: 100%;
}

.preview-title {
  margin: 0;
  font-size: clamp(2rem, 2.7vw, 3rem);
  line-height: 1.05;
  color: var(--color-text);
}

.preview-copy {
  margin: 0;
  color: var(--color-muted);
  font-size: 1rem;
  max-width: 620px;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.9rem;
  align-items: center;
}

.btn-secondary {
  background: #ffffff;
  color: var(--color-text);
  border: 1px solid rgba(33, 50, 26, 0.12);
  box-shadow: 0 8px 20px rgba(21, 38, 18, 0.08);
}

.preview-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 1rem;
}

.metric-card {
  background: #ffffff;
  border-radius: 22px;
  padding: 1.35rem 1.2rem;
  box-shadow: var(--shadow-soft);
  display: grid;
  gap: 0.8rem;
}

.metric-label {
  font-size: 0.95rem;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.metric-card strong {
  font-size: 2.1rem;
  color: var(--color-text);
}

.metric-card p {
  margin: 0;
  color: var(--color-muted);
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.summary-header h3 {
  margin: 0;
}

.summary-header p {
  margin: 0.35rem 0 0;
  color: var(--color-muted);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.95rem 0;
  border-top: 1px solid rgba(33, 50, 26, 0.08);
}

.summary-row:first-of-type {
  border-top: none;
}

.summary-row span {
  color: var(--color-muted);
}

.summary-row strong {
  color: var(--color-text);
}

@media (max-width: 900px) {
  .preview-metrics {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 640px) {
  .preview-metrics {
    grid-template-columns: 1fr;
  }

  .hero-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
