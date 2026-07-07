<template>
  <div class="page-container">
    <div class="container">
      <div class="notification-history-card">
        <header class="notification-history-header">
          <div>
            <p>{{ t.title }}</p>
          </div>
          <div class="notification-history-actions">
            <button type="button" class="ghost-button" @click="markVisibleAsRead"
              :disabled="isLoading || !hasUnreadVisible">
              {{ t.btnMarkVisible }}
            </button>
            <button type="button" class="ghost-button" @click="clearReadFilter" :disabled="isLoading">
              {{ t.btnClearRead }}
            </button>
          </div>
        </header>

        <!-- Mensaje para vendedores -->
        <div v-if="currentUser?.role === 'vendedor'" class="seller-message">
          <p>{{ t.sellerMsg }}</p>
          <button @click="$router.push('/seller')">{{ t.goSeller }}</button>
        </div>

        <!-- Contenido del historial solo para otros roles -->
        <div v-else class="notif-body">
          <section class="notification-history-filters">
            <select v-model="readFilter">
              <option value="all">{{ t.filterAll }}</option>
              <option value="unread">{{ t.filterUnread }}</option>
              <option value="read">{{ t.filterRead }}</option>
            </select>

            <input v-model="fromDate" type="date" />
            <input v-model="toDate" type="date" />
            <input v-model="searchText" type="text" :placeholder="t.searchPlaceholder" />

            <button type="button" @click="loadHistory" :disabled="isLoading">
              {{ t.btnApply }}
            </button>
          </section>

          <section class="notification-history-summary">
            <article>
              <strong>{{ summary.total }}</strong>
              <span>{{ t.labelTotal }}</span>
            </article>
            <article>
              <strong>{{ summary.unread }}</strong>
              <span>{{ t.labelUnread }}</span>
            </article>
            <article>
              <strong>{{ summary.read }}</strong>
              <span>{{ t.labelRead }}</span>
            </article>
          </section>

          <p v-if="isLoading" class="state-text">{{ t.loading }}</p>
          <p v-else-if="!filteredItems.length" class="state-text">{{ t.empty }}</p>

          <ul v-else class="history-list">

            <li v-for="item in filteredItems" :key="item.id" :class="[
              'history-item',
              item.read ? 'read' : 'unread',
              expandedNotification === String(item.id) ? 'expanded' : ''
            ]" @click="goToNotification(item)">

              <!-- VISTA COMPACTA -->
              <div class="notification-row">

                <div class="notification-main">

                  <div class="notification-title">
                    {{ item.title }}
                  </div>

                  <div v-if="expandedNotification !== item.id" class="notification-preview">
                    {{ item.body }}
                  </div>

                </div>

                <div class="notification-right">

                  <span class="notification-date">
                    {{ formatDate(item.createdAt) }}
                  </span>

                  <span :class="[
                    'severity-badge',
                    `severity-${item.severity || 'info'}`
                  ]">
                    {{ formatSeverity(item.severity) }}
                  </span>

                  <button
                    v-if="!item.read && expandedNotification !== String(item.id)"
                    type="button"
                    class="mark-read-mini"
                    title="Marcar como leída"
                    @click.stop="markAsRead(item.id)"
                  >
                    <i class="bi bi-check2"></i>
                  </button>

                </div>

              </div>

              <!-- DETALLE -->
              <div v-if="expandedNotification === String(item.id)" class="notification-details">

                <pre class="notification-text">{{ item.body }}</pre>

                <div v-if="item.machine" class="detail-row">
                  <strong>{{ t.detailMachine }}</strong>
                  <span>{{ item.machine }}</span>
                </div>

                <div v-if="item.sector" class="detail-row">
                  <strong>{{ t.detailSector }}</strong>
                  <span>{{ item.sector }}</span>
                </div>

                <div class="detail-row">
                  <strong>{{ t.detailStatus }}</strong>
                  <span>{{ item.read ? t.statusRead : t.statusUnread }}</span>
                </div>

                <button v-if="expandedNotification === String(item.id) && !item.read" type="button"
                  class="mark-read-button" @click.stop="markAsRead(item.id)">
                  {{ t.btnMarkRead }}
                </button>

              </div>

            </li>

          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { API_BASE_URL } from '@/utils/api'
import { useLocale } from '@/composables/useLocale'

const TRANSLATIONS = {
  es: {
    title: 'HISTORIAL DE NOTIFICACIONES',
    btnMarkVisible: 'Marcar visibles como leidas',
    btnClearRead: 'Limpiar leidas',
    sellerMsg: 'Como vendedor, no tienes acceso al historial de notificaciones de mantenimiento.',
    goSeller: 'Ir a Cotizaciones',
    filterAll: 'Todas', filterUnread: 'No leidas', filterRead: 'Leidas',
    searchPlaceholder: 'Buscar por titulo o detalle',
    btnApply: 'Aplicar filtros',
    labelTotal: 'Total', labelUnread: 'No leidas', labelRead: 'Leidas',
    loading: 'Cargando historial...',
    empty: 'No hay notificaciones para los filtros seleccionados.',
    detailMachine: 'Máquina:', detailSector: 'Sector:', detailStatus: 'Estado:',
    statusRead: 'Leída', statusUnread: 'No leída',
    btnMarkRead: 'Marcar leída',
    severitySuccess: 'Éxito', severityWarning: 'Atención', severityError: 'Urgente', severityInfo: 'Info',
  },
  pt: {
    title: 'HISTÓRICO DE NOTIFICAÇÕES',
    btnMarkVisible: 'Marcar visíveis como lidas',
    btnClearRead: 'Limpar lidas',
    sellerMsg: 'Como vendedor, não tens acesso ao histórico de notificações de manutenção.',
    goSeller: 'Ir a Cotações',
    filterAll: 'Todas', filterUnread: 'Não lidas', filterRead: 'Lidas',
    searchPlaceholder: 'Pesquisar por título ou detalhe',
    btnApply: 'Aplicar filtros',
    labelTotal: 'Total', labelUnread: 'Não lidas', labelRead: 'Lidas',
    loading: 'Carregando histórico...',
    empty: 'Não há notificações para os filtros selecionados.',
    detailMachine: 'Máquina:', detailSector: 'Setor:', detailStatus: 'Status:',
    statusRead: 'Lida', statusUnread: 'Não lida',
    btnMarkRead: 'Marcar como lida',
    severitySuccess: 'Sucesso', severityWarning: 'Atenção', severityError: 'Urgente', severityInfo: 'Info',
  },
}

export default {
  setup() {
    const { locale } = useLocale()
    return { locale }
  },

  data() {
    return {
      items: [],
      summary: {
        total: 0,
        read: 0,
        unread: 0
      },
      readFilter: 'all',
      fromDate: '',
      toDate: '',
      searchText: '',
      isLoading: false,
      expandedNotification: null
    }
  },

  computed: {
    t() { return TRANSLATIONS[this.locale] || TRANSLATIONS.es },

    filteredItems() {
      const query = this.searchText.trim().toLowerCase()

      if (!query) return this.items

      return this.items.filter(item => {
        const title = String(item.title || '').toLowerCase()
        const body = String(item.body || '').toLowerCase()
        return title.includes(query) || body.includes(query)
      })
    },

    hasUnreadVisible() {
      return this.filteredItems.some(item => !item.read)
    },

    currentUser() {
      return JSON.parse(sessionStorage.getItem('user') || '{}')
    }
  },

  watch: {
    '$route.query.id': {
      immediate: true,
      handler(newId) {
        const id = String(newId || '').trim()
        if (!id) return

        this.expandedNotification = id
        this.markAsRead(id)
      }
    }
  },

  methods: {
    authConfig() {
      return {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`
        }
      }
    },

    goToNotification(item) {
      const id = String(item.id)
      const isOpen = this.expandedNotification === id

      if (isOpen) {
        this.expandedNotification = null
        return
      }

      this.expandedNotification = id

      if (!item.read) {
        this.markAsRead(id)
      }

      this.$router.push({
        path: '/notifications-history',
        query: { id }
      })
    },

    async markAsRead(id) {
      try {
        const parsedId = String(id || '').trim()
        if (!parsedId) return

        const target = this.items.find(i => String(i.id) === parsedId)
        if (target?.read) return

        await axios.post(
          `${API_BASE_URL}/maintenance/notifications/history/read`,
          { ids: [parsedId] },
          this.authConfig()
        )

        this.items = this.items.map(item => ({
          ...item,
          read: String(item.id) === parsedId ? true : item.read
        }))

        this.summary.read += 1
        this.summary.unread = Math.max(0, this.summary.unread - 1)
      } catch (error) {
        this.$notify.notifyApiError(error, 'No se pudo marcar como leída')
      }
    },

    buildHistoryQuery() {
      const params = new URLSearchParams()

      if (this.readFilter && this.readFilter !== 'all') {
        params.set('read', this.readFilter)
      }

      if (this.fromDate) params.set('from', this.fromDate)
      if (this.toDate) params.set('to', this.toDate)

      const raw = params.toString()
      return raw ? `?${raw}` : ''
    },

    async loadHistory() {
      this.isLoading = true

      try {
        const response = await axios.get(
          `${API_BASE_URL}/maintenance/notifications/history${this.buildHistoryQuery()}`,
          this.authConfig()
        )

        this.items = Array.isArray(response.data?.items)
          ? response.data.items
          : []

        this.summary = response.data?.summary || {
          total: this.items.length,
          read: this.items.filter(i => i.read).length,
          unread: this.items.filter(i => !i.read).length
        }
      } catch (error) {
        this.$notify.notifyApiError(
          error,
          'No se pudo cargar el historial de notificaciones'
        )
      } finally {
        this.isLoading = false
      }
    },

    async markVisibleAsRead() {
      const ids = this.filteredItems
        .filter(i => !i.read)
        .map(i => i.id)

      if (!ids.length) return

      try {
        await axios.post(
          `${API_BASE_URL}/maintenance/notifications/history/read`,
          { ids },
          this.authConfig()
        )

        const set = new Set(ids)

        this.items = this.items.map(item =>
          set.has(item.id)
            ? { ...item, read: true }
            : item
        )
        this.expandedNotification = null
        this.summary.read += ids.length
        this.summary.unread = Math.max(0, this.summary.unread - ids.length)
      } catch (error) {
        this.$notify.notifyApiError(
          error,
          'No se pudieron marcar las notificaciones visibles'
        )
      }
    },

    async clearReadFilter() {
      try {
        await axios.delete(
          `${API_BASE_URL}/maintenance/notifications/history/read`,
          this.authConfig()
        )

        this.items = this.items.map(i => ({ ...i, read: false }))
        this.summary.read = 0
        this.summary.unread = this.items.length
      } catch (error) {
        this.$notify.notifyApiError(
          error,
          'No se pudo limpiar el estado de leídas'
        )
      }
    },

    formatDate(value) {
      return new Intl.DateTimeFormat('es-AR', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date(value))
    },

    formatSeverity(value) {
      const map = {
        success: this.t.severitySuccess,
        warning: this.t.severityWarning,
        error: this.t.severityError,
        info: this.t.severityInfo,
      }
      return map[value] || this.t.severityInfo
    }
  },

  mounted() {
    const id = this.$route.query.id

    if (id) {
      this.expandedNotification = String(id)
      this.markAsRead(id)
    }

    const isDark = localStorage.getItem('darkMode') === 'true'
    document.body.style.background = isDark
      ? 'radial-gradient(ellipse at 15% 15%, rgba(120,50,220,0.18) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(255,102,0,0.14) 0%, transparent 55%), #070b14'
      : 'rgb(103, 111, 62)'
    document.body.style.backgroundAttachment = 'fixed'

    const user = JSON.parse(sessionStorage.getItem('user') || '{}')
    if (user.role === 'vendedor') return

    this.loadHistory()
  },

  beforeUnmount() {
    document.body.style.background = ''
  }
}
</script>

<style scoped>
.container,
.charts-section,
.charts-grid,
.chart-card {
  min-width: 0;
}
.notification-history-page {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-history-card,
.notification-history-card * {
  font-family: inherit;
}

.notification-text {
  white-space: pre-wrap;
  font-family: inherit;
  margin: 0;
  line-height: 1.6;
  color: #3a4a2f;
}

.page-container {
  width: 100%;
  min-height: 100vh;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;

  padding: 1rem 0.5rem 2rem;

  background: transparent !important;

  border: none !important;
  box-shadow: none !important;
  outline: none !important;
}


.notification-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  cursor: pointer;
}

.notification-main {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 700;
  color: #26331e;
  margin-bottom: 0.2rem;
}

.notification-preview {
  color: #6b7280;

  overflow: hidden;
  text-overflow: ellipsis;

  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.notification-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: .4rem;
  min-width: 140px;
}

.notification-date {
  font-size: .8rem;
  color: #94a3b8;
}

.mark-read-mini {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 1.5px solid #a3b97a;
  background: transparent;
  color: #6b8a3a;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.18s, color 0.18s;
  padding: 0;
}

.mark-read-mini:hover {
  background: #6b8a3a;
  color: #fff;
  border-color: #6b8a3a;
}

.notification-details {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.detail-row {
  display: flex;
  gap: .5rem;
  margin-bottom: .5rem;
}

.expanded {
  background: #fafcf7;
}

@media (max-width: 768px) {

  .notification-row {
    flex-direction: column;
  }

  .notification-right {
    align-items: flex-start;
    min-width: auto;
  }
}

.history-item {
  text-align: left;
  border-radius: 10px;
  padding: 0.6rem;
  border: 1px solid rgba(148, 163, 184, 0.15);
  background: #ffffff;
  transition: all 0.2s ease;
}

.history-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

/* ELIMINA CUALQUIER MARCO FANTASMA */
.page-container::before,
.page-container::after {
  display: none !important;
  content: none !important;
}

/* POR SI ALGUN PADRE AGREGA EL RECUADRO */
:deep(.page-container),
:deep(.content),
:deep(.wrapper),
:deep(.container) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}


.notification-history-card {
  width: min(1080px, 100%);
  padding: 1.2rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
}

.container {
  width: 100%;
  display: flex;
  justify-content: center;
  /* Anula el .container global de style.css (padding: 1.8rem; background;
     border…), que de otro modo se filtra acá y angosta la tarjeta. */
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.notification-history-card {
  width: min(1080px, 100%);
  margin: 0 auto;
  text-align: center;
}

.notification-history-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.notification-history-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.notification-history-filters {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-content: center;
  justify-content: center;

  align-items: center;
  gap: 0.6rem;
}

.notification-history-filters input,
.notification-history-filters select {
  flex: 1 1 160px;
  min-width: 0;
  width: auto;
}

.notification-history-filters button {
  flex-shrink: 0;
}

.notification-history-summary article {
  text-align: center;
  justify-items: center;
}

.notification-history-filters input,
.notification-history-filters select {
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 0.5rem 0.75rem;
  font-size: 0.83rem;
  line-height: 1.4;
  height: 38px;
  box-sizing: border-box;
}

.notification-history-filters button,
.ghost-button,
.mark-read-button {
  border-radius: 10px;
  padding: 0.45rem 0.9rem;
  font-size: 0.8rem;
  height: 38px;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
}

.notification-history-filters input,
.notification-history-filters select {
  background: #f8fafc;
}

.notification-history-filters button,
.mark-read-button {
  background: #3b6b2e;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.ghost-button {
  background: #f1f0ed;
  color: #2d3d24;
  cursor: pointer;
  font-size: 0.78rem;
  padding: 0.4rem 0.75rem;
  height: auto;
}

.notification-history-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin-bottom: 1rem;
}

.notification-history-summary article {
  background: #f9f7f2;
  border-radius: 14px;
  padding: 0.8rem;
  display: grid;
}

.notification-history-summary strong {
  font-size: 1.35rem;
}

.state-text {
  color: #5a7d3a;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.3rem;
}

.history-item {
  text-align: left;
}

.history-item-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.history-item-top>div {
  flex: 1;
}

.history-item.unread {
  border-left: 5px solid #6b8e3a;
}

.history-item.read {
  border-left: 5px solid #94a3b8;
  opacity: 0.9;
}



.history-item-top h3,
.history-item-top p {
  margin: 0;
}

.history-item-top p {
  color: #3a4a2f;
  margin-top: 0.2rem;
}

.history-item-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #ececec;
  color: #7a8b73;
  font-size: 0.85rem;
}

.severity-badge {
  border-radius: 999px;
  padding: 0.25rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 700;
  height: fit-content;
}

.severity-error {
  background: #fee2e2;
  color: #991b1b;
}

.severity-warning {
  background: #ffedd5;
  color: #9a3412;
}

.severity-success {
  background: #e8f0df;
  color: #5a7d3a;
}

.severity-info {
  background: #f1f5e8;
  color: #6b8e3a;
}

.mark-read-button {
  margin-top: 0.75rem;
  margin-left: auto;
  display: block;
}

@media (max-width: 900px) {
  .page-container {
    padding: 0.5rem;
  }

  .notification-history-card {
    margin: 0 auto 1.5rem;
    padding: 1rem;
    border-radius: 16px;
  }

  .notification-history-header {
    flex-direction: column;
  }

  .notification-history-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .notification-history-actions button {
    flex: 1 1 auto;
    font-size: 0.78rem;
  }

  .notification-history-filters {
    gap: 0.5rem;
    flex-direction: column;
    align-items: stretch;
  }

  .notification-history-filters input,
  .notification-history-filters select {
    width: 100%;
    flex: unset;
    height: 40px;
  }

  .notification-history-filters button {
    width: 100%;
    height: 40px;
  }

  .ghost-button {
    height: 36px;
    font-size: 0.8rem;
    padding: 0.35rem 0.75rem;
  }

  .notification-history-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .notification-history-summary article {
    padding: 0.6rem;
  }

  .notification-history-summary strong {
    font-size: 1.15rem;
  }

  .history-item {
    padding: 0.5rem;
  }
}

.seller-message {
  text-align: center;
  padding: 2rem;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 2rem 0;
}

.seller-message p {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: #495057;
}

.seller-message button {
  padding: 0.75rem 1.5rem;
  background: #6b8e3a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.seller-message button:hover {
  background: #5a7d3a;
}

/* ── Scroll-lock: header/filtros fijos, solo lista scrollea ─── */
.page-container {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding-bottom: 0;
}
.container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.notification-history-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.notif-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.history-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

@media (max-width: 900px) {
  .page-container {
    height: auto;
    min-height: 100vh;
    overflow: visible;
  }
  .container,
  .notification-history-card,
  .notif-body {
    overflow: visible;
    flex: unset;
  }
  .history-list {
    overflow-y: visible;
    flex: unset;
  }
}

/* ── Dark mode overrides ── */
[data-theme="dark"] .notification-history-card {
  background: rgba(13,18,35,0.82) !important;
  backdrop-filter: blur(24px) saturate(160%);
  border: 1px solid rgba(255,255,255,0.08);
  box-shadow: 0 8px 40px rgba(0,0,0,0.6);
  color: #ffffff;
}

[data-theme="dark"] .notification-history-header {
  background: rgba(13,18,35,0.6) !important;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

[data-theme="dark"] .notification-history-header p,
[data-theme="dark"] .notification-history-header h1,
[data-theme="dark"] .notification-history-header h2,
[data-theme="dark"] .notification-history-header h3 {
  color: #ffffff !important;
}

[data-theme="dark"] .notification-history-summary article {
  background: rgba(13,18,35,0.72) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .notification-history-summary article strong {
  color: #FF8C42 !important;
}

[data-theme="dark"] .notification-history-summary article span {
  color: rgba(255,255,255,0.6) !important;
}

[data-theme="dark"] .notification-history-filters select,
[data-theme="dark"] .notification-history-filters input[type="date"],
[data-theme="dark"] .notification-history-filters input[type="text"] {
  background: rgba(13,18,35,0.8) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  color: rgba(255,255,255,0.85) !important;
  color-scheme: dark;
}

[data-theme="dark"] .notification-history-filters button {
  background: linear-gradient(135deg, #FF6600, #ff3d00) !important;
  color: #ffffff !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(255,102,0,0.3);
}

[data-theme="dark"] .ghost-button {
  background: rgba(255,255,255,0.06) !important;
  color: rgba(255,255,255,0.8) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
}

[data-theme="dark"] .ghost-button:hover {
  background: rgba(255,102,0,0.15) !important;
  color: #FF8C42 !important;
}

[data-theme="dark"] .history-item {
  background: rgba(13,18,35,0.55) !important;
  border: 1px solid rgba(255,255,255,0.07) !important;
  color: #ffffff !important;
}

[data-theme="dark"] .history-item:hover {
  background: rgba(255,102,0,0.07) !important;
}

[data-theme="dark"] .history-item.expanded {
  background: rgba(13,18,35,0.72) !important;
  border-color: rgba(255,102,0,0.25) !important;
}

[data-theme="dark"] .notification-title {
  color: rgba(255,255,255,0.95) !important;
}

[data-theme="dark"] .notification-text,
[data-theme="dark"] .notification-details,
[data-theme="dark"] .notification-meta {
  color: rgba(255,255,255,0.7) !important;
}

[data-theme="dark"] .notification-date,
[data-theme="dark"] .notification-time {
  color: rgba(255,255,255,0.45) !important;
}

[data-theme="dark"] .notif-body {
  background: transparent !important;
}

[data-theme="dark"] .seller-message {
  background: rgba(13,18,35,0.72) !important;
  color: rgba(255,255,255,0.8) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
}
</style>
