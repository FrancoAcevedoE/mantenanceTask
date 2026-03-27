<script setup>
import { computed, onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useNotificationsStore } from '@/stores/notifications'

const notificationsStore = useNotificationsStore()
const router = useRouter()

const {
  items,
  summary,
  unreadCount,
  isPanelOpen,
  isLoading,
  browserPermission,
  hasBrowserNotificationsSupport,
  hasPushSupport,
  pushEnabled,
  pushLoading
} = storeToRefs(notificationsStore)

const permissionLabel = computed(() => {
  if (!hasBrowserNotificationsSupport.value) {
    return 'Tu navegador no soporta notificaciones del sistema'
  }

  if (browserPermission.value === 'granted') {
    return 'Notificaciones del sistema activadas'
  }

  if (browserPermission.value === 'denied') {
    return 'Las notificaciones del sistema están bloqueadas en este navegador'
  }

  return 'Activar notificaciones del sistema'
})

const panelClasses = computed(() => [
  'notification-panel',
  { 'notification-panel--open': isPanelOpen.value }
])

const formatDateTime = (value) => {
  if (!value) {
    return 'Sin fecha'
  }

  return new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}

const onDocumentClick = (event) => {
  if (!event.target.closest('.notification-shell')) {
    notificationsStore.closePanel()
  }
}

const onPermissionRequest = async () => {
  await notificationsStore.requestBrowserPermission()
}

const onPushToggle = async () => {
  if (pushEnabled.value) {
    await notificationsStore.disablePushNotifications()
    return
  }

  await notificationsStore.enablePushNotifications()
}

const goToHistory = async () => {
  notificationsStore.closePanel()
  await router.push('/notifications-history')
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div class="notification-shell">
    <button type="button" class="notification-bell" @click.stop="notificationsStore.togglePanel()">
      <i class="bi bi-bell-fill"></i>
      <span v-if="unreadCount" class="notification-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>

    <aside :class="panelClasses" @click.stop>
      <header class="notification-panel__header">
        <div>
          <p class="notification-panel__eyebrow">Centro de alertas</p>
          <h2>Notificaciones</h2>
        </div>
        <button type="button" class="notification-text-button" @click="notificationsStore.markAllAsRead()">
          Marcar todo como leído
        </button>
      </header>

      <section class="notification-summary-grid">
        <article class="notification-summary-card notification-summary-card--danger">
          <strong>{{ summary.stoppedMachinesCount }}</strong>
          <span>Máquinas detenidas</span>
        </article>
        <article class="notification-summary-card notification-summary-card--warning">
          <strong>{{ summary.pendingMaintenancesCount }}</strong>
          <span>Trabajos pendientes</span>
        </article>
      </section>

      <button type="button" class="notification-history-button" @click="goToHistory">
        Ver historial completo
      </button>

      <button
        v-if="browserPermission !== 'granted'"
        type="button"
        class="notification-permission-button"
        :disabled="!hasBrowserNotificationsSupport || browserPermission === 'denied'"
        @click="onPermissionRequest"
      >
        {{ permissionLabel }}
      </button>
      <p v-else class="notification-permission-text">Además de la campana, la app puede avisarte en el sistema cuando aparezcan alertas nuevas.</p>

      <button
        v-if="hasPushSupport"
        type="button"
        class="notification-push-button"
        :disabled="pushLoading"
        @click="onPushToggle"
      >
        {{ pushEnabled ? 'Desactivar push con app cerrada' : 'Activar push con app cerrada' }}
      </button>
      <p v-else class="notification-permission-text">Este navegador no soporta notificaciones push web.</p>

      <div v-if="isLoading" class="notification-state">Cargando alertas...</div>
      <div v-else-if="!items.length" class="notification-state">No hay alertas activas en este momento.</div>

      <ul v-else class="notification-list">
        <li
          v-for="item in items"
          :key="item.id"
          :class="['notification-item', `notification-item--${item.severity || 'warning'}`]"
          @click="notificationsStore.markAsRead(item.id)"
        >
          <div class="notification-item__body">
            <div class="notification-item__top">
              <strong>{{ item.title }}</strong>
              <span v-if="!notificationsStore.readIds.includes(item.id)" class="notification-item__dot"></span>
            </div>
            <p>{{ item.message }}</p>
            <small>
              <span v-if="item.sector">{{ item.sector }}</span>
              <span v-if="item.operator"> · {{ item.operator }}</span>
              <span> · {{ formatDateTime(item.createdAt) }}</span>
            </small>
          </div>
        </li>
      </ul>
    </aside>
  </div>
</template>

<style scoped>
.notification-shell {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1200;
}

.notification-bell {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border: 0;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f172a, #1e293b);
  color: #f8fafc;
  box-shadow: 0 18px 30px rgba(15, 23, 42, 0.28);
  cursor: pointer;
}

.notification-bell i {
  font-size: 1.3rem;
}

.notification-badge {
  position: absolute;
  top: -0.35rem;
  right: -0.35rem;
  min-width: 1.4rem;
  height: 1.4rem;
  padding: 0 0.3rem;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
}

.notification-panel {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  width: min(390px, calc(100vw - 2rem));
  max-height: min(78vh, 680px);
  overflow: auto;
  padding: 1rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 22px 48px rgba(15, 23, 42, 0.22);
  border: 1px solid rgba(148, 163, 184, 0.28);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-8px) scale(0.98);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
}

.notification-panel--open {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}

.notification-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
}

.notification-panel__header h2,
.notification-panel__header p {
  margin: 0;
}

.notification-panel__eyebrow {
  color: #64748b;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 0.3rem;
}

.notification-text-button,
.notification-permission-button,
.notification-push-button {
  border: 0;
  border-radius: 14px;
  cursor: pointer;
}

.notification-history-button {
  width: 100%;
  border: 0;
  border-radius: 14px;
  padding: 0.85rem 1rem;
  margin-bottom: 0.9rem;
  background: #e0f2fe;
  color: #075985;
  font-weight: 700;
  cursor: pointer;
}

.notification-text-button {
  background: transparent;
  color: #0f766e;
  font-weight: 600;
}

.notification-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.notification-summary-card {
  padding: 0.95rem;
  border-radius: 18px;
  color: #fff;
  display: grid;
  gap: 0.2rem;
}

.notification-summary-card strong {
  font-size: 1.55rem;
}

.notification-summary-card--danger {
  background: linear-gradient(135deg, #b91c1c, #7f1d1d);
}

.notification-summary-card--warning {
  background: linear-gradient(135deg, #c2410c, #9a3412);
}

.notification-permission-button {
  width: 100%;
  padding: 0.85rem 1rem;
  margin-bottom: 0.9rem;
  background: #e2e8f0;
  color: #0f172a;
  font-weight: 600;
}

.notification-push-button {
  width: 100%;
  padding: 0.85rem 1rem;
  margin-bottom: 0.9rem;
  background: linear-gradient(135deg, #0369a1, #0f766e);
  color: #fff;
  font-weight: 700;
}

.notification-permission-button:disabled,
.notification-push-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.notification-permission-text,
.notification-state {
  margin: 0 0 1rem;
  color: #475569;
}

.notification-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.notification-item {
  padding: 0.9rem;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  background: #fff;
  cursor: pointer;
}

.notification-item--error {
  border-left: 5px solid #dc2626;
}

.notification-item--warning {
  border-left: 5px solid #ea580c;
}

.notification-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.notification-item__body p,
.notification-item__body small {
  margin: 0;
}

.notification-item__body {
  display: grid;
  gap: 0.35rem;
}

.notification-item__body p {
  color: #334155;
}

.notification-item__body small {
  color: #64748b;
}

.notification-item__dot {
  width: 0.65rem;
  height: 0.65rem;
  border-radius: 999px;
  background: #0f766e;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .notification-shell {
    top: 0.75rem;
    right: 0.75rem;
  }

  .notification-bell {
    width: 48px;
    height: 48px;
    border-radius: 16px;
  }

  .notification-panel {
    width: min(360px, calc(100vw - 1.5rem));
    max-height: 70vh;
  }
}
</style>