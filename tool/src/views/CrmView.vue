<template>
  <div class="container crm-wrap">
    <div class="topbar">
      <h1><i class="bi bi-graph-up-arrow"></i> CRM</h1>
      <span class="crm-subtitle">Gestión comercial</span>
    </div>

    <div class="crm-tabs-bar">
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

    <div class="crm-body">
      <CrmDashboard  v-if="activeTab === 'dashboard'" />
      <CrmClients    v-else-if="activeTab === 'clientes'" />
      <CrmPipeline   v-else-if="activeTab === 'pipeline'" />
      <CrmActivities v-else-if="activeTab === 'actividades'" />
      <div v-else-if="activeTab === 'cotizaciones'" class="crm-quotes-wrap">
        <SellerView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCrmStore } from '@/stores/crm'
import CrmDashboard   from '@/components/crm/CrmDashboard.vue'
import CrmClients     from '@/components/crm/CrmClients.vue'
import CrmPipeline    from '@/components/crm/CrmPipeline.vue'
import CrmActivities  from '@/components/crm/CrmActivities.vue'
import SellerView     from '@/views/sellerView.vue'

const activeTab = ref('dashboard')
const crmStore  = useCrmStore()

const tabs = computed(() => [
  { key: 'dashboard',    label: 'Dashboard',    icon: 'bi bi-speedometer2' },
  { key: 'clientes',     label: 'Clientes',     icon: 'bi bi-people-fill',
    badge: crmStore.visibleClients.length || null },
  { key: 'pipeline',    label: 'Pipeline',     icon: 'bi bi-kanban-fill' },
  { key: 'cotizaciones', label: 'Cotizaciones', icon: 'bi bi-file-earmark-text-fill' },
  { key: 'actividades',  label: 'Actividades',  icon: 'bi bi-clock-history',
    badge: crmStore.pendingActivitiesCount || null, badgeClass: 'crm-tab-badge--warn' },
])

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
.crm-tabs-bar {
  display: flex;
  gap: 0.25rem;
  border-bottom: 2px solid rgba(107, 142, 58, 0.14);
  padding-bottom: 0;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;
}

.crm-tab {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.6rem 1rem;
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
  background: rgba(107, 142, 58, 0.07);
  color: var(--color-text);
  transform: none;
  box-shadow: none;
}

.crm-tab--active {
  background: rgba(107, 142, 58, 0.1);
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

.crm-body { flex: 1; }

/* strip the extra page-container / container nesting from sellerView when embedded */
.crm-quotes-wrap :deep(.page-container) { background: none; padding: 0; }
.crm-quotes-wrap :deep(.container)      { padding: 1rem 1.25rem; max-width: none; }
</style>
