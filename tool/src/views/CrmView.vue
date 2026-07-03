<template>
  <div class="container crm-wrap">
    <div class="topbar">
      <h1><i class="bi bi-graph-up-arrow"></i> CRM</h1>
      <span class="crm-subtitle">Gestión comercial</span>
    </div>

    <div class="crm-tabs-wrap">
      <div class="crm-tabs-bar" ref="tabsBarRef">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['crm-tab', { 'crm-tab--active': activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
          <span v-if="tab.badge" class="crm-tab-badge" :class="tab.badgeClass">{{ tab.badge }}</span>
        </button>
      </div>
      <div class="crm-tabs-fade" aria-hidden="true"><i class="bi bi-chevron-right"></i></div>
    </div>

    <div class="crm-body">
      <CrmDashboard  v-if="activeTab === 'dashboard'" />
      <CrmClients    v-else-if="activeTab === 'clientes'" :pending-edit="pendingEdit" />
      <CrmPipeline   v-else-if="activeTab === 'pipeline'" @edit-client="onEditClient" />
      <CrmActivities v-else-if="activeTab === 'actividades'" />
      <div v-else-if="activeTab === 'cotizaciones'" class="crm-quotes-wrap">
        <SellerView />
      </div>

      <!-- Calculadora m² -->
      <div v-else-if="activeTab === 'calculadora'" class="calc-wrap">
        <div class="calc-card">
          <h3><i class="bi bi-calculator"></i> Calculadora de m²</h3>
          <button type="button" class="calc-unit-toggle" @click="toggleUnit">
            {{ calcUnit === 'mm' ? 'mm' : 'metros' }}
          </button>
          <div class="calc-fields">
            <div class="calc-field">
              <label>Largo ({{ calcUnit }})</label>
              <input v-model.number="calcLargo" type="number" min="0" :placeholder="calcUnit === 'mm' ? '3050' : '3.05'" :step="calcUnit === 'mm' ? 1 : 0.01" @input="calcResult" />
            </div>
            <div class="calc-field">
              <label>Alto / Ancho ({{ calcUnit }})</label>
              <input v-model.number="calcAlto" type="number" min="0" :placeholder="calcUnit === 'mm' ? '1220' : '1.22'" :step="calcUnit === 'mm' ? 1 : 0.01" @input="calcResult" />
            </div>
          </div>
          <div class="calc-display" :class="{ active: calcM2 !== null }">
            <span class="calc-label">Resultado</span>
            <span class="calc-value">{{ calcM2 !== null ? calcM2 + ' m²' : '—' }}</span>
          </div>
          <div v-if="calcM2 !== null" class="calc-detail">
            {{ calcLargo }} {{ calcUnit }} × {{ calcAlto }} {{ calcUnit }} = <strong>{{ calcM2 }} m²</strong>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useCrmStore } from '@/stores/crm'
import CrmDashboard   from '@/components/crm/CrmDashboard.vue'
import CrmClients     from '@/components/crm/CrmClients.vue'
import CrmPipeline    from '@/components/crm/CrmPipeline.vue'
import CrmActivities  from '@/components/crm/CrmActivities.vue'
import SellerView     from '@/views/sellerView.vue'

const activeTab  = ref('dashboard')
const pendingEdit = ref(null)
const crmStore   = useCrmStore()
const tabsBarRef = ref(null)

watch(activeTab, async () => {
  await nextTick()
  const bar = tabsBarRef.value
  if (!bar) return
  const active = bar.querySelector('.crm-tab--active')
  if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' })
})

function onEditClient(client) {
  pendingEdit.value = client
  activeTab.value = 'clientes'
  setTimeout(() => { pendingEdit.value = null }, 400)
}

const tabs = computed(() => [
  { key: 'dashboard',    label: 'Dashboard',    icon: 'bi bi-speedometer2' },
  { key: 'clientes',     label: 'Clientes',     icon: 'bi bi-people-fill',
    badge: crmStore.visibleClients.length || null },
  { key: 'pipeline',    label: 'Pipeline', icon: 'bi bi-kanban-fill' },
  { key: 'cotizaciones', label: 'Cotizaciones', icon: 'bi bi-file-earmark-text-fill' },
  { key: 'actividades',  label: 'Actividades',  icon: 'bi bi-clock-history',
    badge: crmStore.pendingActivitiesCount || null, badgeClass: 'crm-tab-badge--warn' },
  { key: 'calculadora', label: 'Calc. m²', icon: 'bi bi-calculator' },
])

const calcLargo = ref(null)
const calcAlto = ref(null)
const calcM2 = ref(null)
const calcUnit = ref('mm')

function toggleUnit() {
  calcUnit.value = calcUnit.value === 'mm' ? 'm' : 'mm'
  calcLargo.value = null
  calcAlto.value = null
  calcM2.value = null
}

function calcResult() {
  if (calcLargo.value > 0 && calcAlto.value > 0) {
    if (calcUnit.value === 'mm') {
      calcM2.value = Number(((calcLargo.value * calcAlto.value) / 1000000).toFixed(4))
    } else {
      calcM2.value = Number((calcLargo.value * calcAlto.value).toFixed(4))
    }
  } else {
    calcM2.value = null
  }
}

onMounted(() => {
  Promise.all([crmStore.fetchClients(), crmStore.fetchActivities()])
})
</script>

<style scoped>
.crm-wrap {
  min-height: calc(100vh - 1rem);
  display: flex;
  flex-direction: column;
  padding-top: 0.4rem;
  padding-bottom: 1.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  max-width: 100%;
  overflow-x: hidden;
}

.topbar {
  display: flex;
  align-items: baseline;
  gap: 0.75rem;
  padding-bottom: 0.5rem;
}

.crm-subtitle {
  font-size: 0.78rem;
  color: var(--color-muted);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

/* ── Tabs bar ── */
.crm-tabs-wrap {
  position: relative;
  margin-bottom: 1.25rem;
  overflow: hidden;
}

.crm-tabs-fade { display: none; }

.crm-tabs-bar {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid rgba(107, 142, 58, 0.14);
  padding-bottom: 0;
  flex-wrap: wrap;
}

.crm-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1rem;
  position: relative;
  border-radius: 12px 12px 0 0;
  background: transparent;
  color: var(--color-muted);
  box-shadow: none;
  font-size: 0.83rem;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  margin-bottom: -2px;
  transition: color 0.18s, border-color 0.18s, background 0.18s;
  letter-spacing: 0.04em;
}

.crm-tab i { font-size: 1rem; }

.crm-tab:hover:not(.crm-tab--active) {
  background: transparent;
  color: var(--color-text);
  transform: none;
  box-shadow: none;
}

.crm-tab--active {
  background: transparent;
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: 700;
}

.crm-tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary);
  color: #fff;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
}

.crm-tab-badge--warn { background: #f59e0b; }

.crm-body { flex: 1; min-width: 0; overflow-x: hidden; }

/* Calculadora */
.calc-wrap { display: flex; justify-content: center; padding-top: 1rem; }

.calc-card {
  background: rgba(255,255,255,0.9);
  border: 1px solid rgba(107,142,58,0.15);
  border-radius: 18px;
  padding: 1.5rem;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 4px 20px rgba(0,0,0,0.06);
}

.calc-card h3 {
  margin: 0 0 1.2rem;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--color-primary, #6b8e3a);
}

.calc-unit-toggle {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 1rem;
  border-radius: 8px;
  border: 1px solid rgba(107,142,58,0.25);
  background: rgba(107,142,58,0.08);
  color: var(--color-primary, #6b8e3a);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  margin-bottom: 0.8rem;
  transition: all 0.15s;
}
.calc-unit-toggle:hover { background: rgba(107,142,58,0.16); }

.calc-fields { display: flex; gap: 0.8rem; margin-bottom: 1rem; }

.calc-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.calc-field label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-muted);
}

.calc-field input {
  padding: 0.6rem 0.8rem;
  border: 1px solid rgba(107,142,58,0.2);
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}
.calc-field input:focus { border-color: var(--color-primary, #6b8e3a); outline: none; box-shadow: 0 0 0 3px rgba(107,142,58,0.1); }

.calc-display {
  text-align: center;
  padding: 1rem;
  border-radius: 14px;
  background: rgba(107,142,58,0.06);
  border: 1px solid rgba(107,142,58,0.12);
  transition: all 0.3s;
}

.calc-display.active {
  background: rgba(107,142,58,0.12);
  border-color: rgba(107,142,58,0.3);
}

.calc-label {
  display: block;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-muted);
  margin-bottom: 0.3rem;
}

.calc-value {
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--color-primary, #6b8e3a);
  font-family: 'Poppins', sans-serif;
}

.calc-detail {
  text-align: center;
  font-size: 0.78rem;
  color: var(--color-muted);
  margin-top: 0.6rem;
}

/* strip the extra page-container / container nesting from sellerView when embedded */
.crm-quotes-wrap :deep(.page-container) { background: none; padding: 0; }
.crm-quotes-wrap :deep(.container)      { padding: 1rem 1.25rem; max-width: none; }

@media (max-width: 768px) {
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.2rem;
  }
  .topbar h1 { font-size: 1.2rem; }

  .crm-tabs-wrap { overflow: visible; }

  .crm-tabs-bar {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    flex-wrap: nowrap;
    gap: 0.15rem;
    padding-bottom: 0;
    scrollbar-width: none;
    scroll-behavior: smooth;
  }
  .crm-tabs-bar::-webkit-scrollbar { display: none; }

  .crm-tabs-fade { display: none; }

  .crm-tab {
    padding: 0.4rem 0.6rem;
    font-size: 0.64rem;
    white-space: nowrap;
    flex-shrink: 0;
    flex-direction: column;
    gap: 0.1rem;
    text-align: center;
    border-radius: 10px 10px 0 0;
  }
  .crm-tab i { font-size: 1.05rem; }
  .crm-tab span { display: block; }
  .crm-tab-badge { position: absolute; top: 0px; right: 0px; min-width: 14px; height: 14px; font-size: 0.58rem; }

  .crm-quotes-wrap :deep(.container) { padding: 0.5rem 0.4rem; }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .crm-tab { padding: 0.5rem 0.75rem; font-size: 0.78rem; }
}
</style>
