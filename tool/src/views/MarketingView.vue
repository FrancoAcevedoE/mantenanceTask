<template>
  <div class="container mk-wrap">
    <div class="mk-topbar">
      <h1><i class="bi bi-megaphone-fill"></i> Marketing</h1>
      <span class="mk-subtitle">Campañas · Contactos · Cuentas</span>
    </div>

    <!-- Tabs -->
    <div class="mk-tabs-wrap">
      <div class="mk-tabs-bar">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          :class="['mk-tab', { 'mk-tab--active': activeTab === tab.key }]"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          <span>{{ tab.label }}</span>
          <span v-if="tab.badge" class="mk-tab-badge">{{ tab.badge }}</span>
        </button>
      </div>
    </div>

    <div class="mk-body">
      <MarketingDashboard  v-if="activeTab === 'dashboard'" />
      <MarketingCampaigns  v-else-if="activeTab === 'campanas'" />
      <MarketingContacts   v-else-if="activeTab === 'contactos'" />
      <MarketingAccounts   v-else-if="activeTab === 'cuentas'" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCrmStore }       from '@/stores/crm'
import { useMarketingStore } from '@/stores/marketing'
import MarketingDashboard  from '@/components/marketing/MarketingDashboard.vue'
import MarketingCampaigns  from '@/components/marketing/MarketingCampaigns.vue'
import MarketingContacts   from '@/components/marketing/MarketingContacts.vue'
import MarketingAccounts   from '@/components/marketing/MarketingAccounts.vue'

const activeTab   = ref('dashboard')
const crmStore    = useCrmStore()
const mStore      = useMarketingStore()

const tabs = computed(() => [
  { key: 'dashboard',  label: 'Dashboard',  icon: 'bi bi-speedometer2' },
  { key: 'campanas',   label: 'Campañas',   icon: 'bi bi-megaphone-fill',
    badge: mStore.campaigns.filter(c => c.estado === 'activa').length || null },
  { key: 'contactos',  label: 'Contactos',  icon: 'bi bi-person-lines-fill',
    badge: mStore.contacts.length || null },
  { key: 'cuentas',    label: 'Cuentas',    icon: 'bi bi-building',
    badge: crmStore.visibleClients.length || null },
])

onMounted(async () => {
  await Promise.all([
    crmStore.clients.length ? Promise.resolve() : crmStore.fetchClients(),
    mStore.fetchCampaigns(),
  ])
})
</script>

<style scoped>
.mk-wrap {
  min-height: calc(100vh - 1rem);
  display: flex; flex-direction: column;
  padding-top: 0.4rem; padding-bottom: 1.5rem;
  padding-left: 0.5rem; padding-right: 0.5rem;
  max-width: 100%; overflow-x: hidden;
}

.mk-topbar {
  display: flex; align-items: baseline; gap: 0.75rem; padding-bottom: 0.5rem;
}
.mk-topbar h1 { font-size: 1.35rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
.mk-topbar h1 i { color: var(--color-primary); }
.mk-subtitle {
  font-size: 0.78rem; color: var(--color-muted);
  letter-spacing: .08em; text-transform: uppercase;
}

/* Tabs */
.mk-tabs-wrap { margin-bottom: 1.25rem; overflow: hidden; }
.mk-tabs-bar {
  display: flex; gap: 0.25rem;
  border-bottom: 2px solid rgba(107,142,58,.14);
  flex-wrap: wrap;
}
.mk-tab {
  display: inline-flex; align-items: center; gap: 0.45rem;
  padding: 0.6rem 1rem; position: relative;
  border-radius: 12px 12px 0 0; background: transparent;
  color: var(--color-muted); box-shadow: none; font-size: 0.83rem;
  font-weight: 600; border-bottom: 3px solid transparent;
  margin-bottom: -2px; transition: color .18s, border-color .18s;
  letter-spacing: .04em;
}
.mk-tab i { font-size: 1rem; }
.mk-tab:hover:not(.mk-tab--active) { color: var(--color-text); background: transparent; transform: none; box-shadow: none; }
.mk-tab--active { color: var(--color-primary); border-bottom-color: var(--color-primary); font-weight: 700; background: transparent; }
.mk-tab-badge {
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--color-primary); color: #fff;
  border-radius: 999px; font-size: 0.68rem; font-weight: 700;
  min-width: 18px; height: 18px; padding: 0 5px;
}

.mk-body { flex: 1; min-width: 0; overflow-x: hidden; }

@media (max-width: 640px) {
  .mk-tabs-bar {
    overflow-x: auto; flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none; scroll-behavior: smooth;
  }
  .mk-tabs-bar::-webkit-scrollbar { display: none; }
  .mk-tab { padding: 0.4rem 0.6rem; font-size: 0.64rem; white-space: nowrap; flex-shrink: 0; flex-direction: column; gap: 0.1rem; text-align: center; }
  .mk-tab i { font-size: 1.05rem; }
  .mk-tab-badge { position: absolute; top: 0; right: 0; min-width: 14px; height: 14px; font-size: 0.58rem; }
}
</style>

<style>
[data-theme="dark"] .mk-tabs-bar { border-color: rgba(255,255,255,.08) !important; }
</style>
