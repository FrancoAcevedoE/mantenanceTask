<template>
  <div class="page-container">
    <div class="container">
      <div class="notification-history-card">
        <header class="notification-history-header">
          <div>
            <p>HISTORIAL DE NOTIFICACIONES</p>
          </div>
          <div class="notification-history-actions">
            <button type="button" class="ghost-button" @click="markVisibleAsRead"
              :disabled="isLoading || !hasUnreadVisible">
              Marcar visibles como leidas
            </button>
            <button type="button" class="ghost-button" @click="clearReadFilter" :disabled="isLoading">
              Limpiar leidas
            </button>
          </div>
        </header>

        <!-- Mensaje para vendedores -->
        <div v-if="currentUser?.role === 'vendedor'" class="seller-message">
          <p>Como vendedor, no tienes acceso al historial de notificaciones de mantenimiento.</p>
          <button @click="$router.push('/seller')">Ir a Cotizaciones</button>
        </div>

        <!-- Contenido del historial solo para otros roles -->
        <div v-else>
          <section class="notification-history-filters">
            <select v-model="readFilter">
              <option value="all">Todas</option>
              <option value="unread">No leidas</option>
              <option value="read">Leidas</option>
            </select>

            <input v-model="fromDate" type="date" />
            <input v-model="toDate" type="date" />
            <input v-model="searchText" type="text" placeholder="Buscar por titulo o detalle" />

            <button type="button" @click="loadHistory" :disabled="isLoading">
              Aplicar filtros
            </button>
          </section>

          <section class="notification-history-summary">
            <article>
              <strong>{{ summary.total }}</strong>
              <span>Total</span>
            </article>
            <article>
              <strong>{{ summary.unread }}</strong>
              <span>No leidas</span>
            </article>
            <article>
              <strong>{{ summary.read }}</strong>
              <span>Leidas</span>
            </article>
          </section>

          <p v-if="isLoading" class="state-text">Cargando historial...</p>
          <p v-else-if="!filteredItems.length" class="state-text">No hay notificaciones para los filtros seleccionados.
          </p>

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

                </div>

              </div>

              <!-- DETALLE -->
              <div v-if="expandedNotification === String(item.id)" class="notification-details">

                <pre class="notification-text">{{ item.body }}</pre>

                <div v-if="item.machine" class="detail-row">
                  <strong>Máquina:</strong>
                  <span>{{ item.machine }}</span>
                </div>

                <div v-if="item.sector" class="detail-row">
                  <strong>Sector:</strong>
                  <span>{{ item.sector }}</span>
                </div>

                <div class="detail-row">
                  <strong>Estado:</strong>
                  <span>
                    {{ item.read ? 'Leída' : 'No leída' }}
                  </span>
                </div>

                <button v-if="expandedNotification === String(item.id) && !item.read" type="button"
                  class="mark-read-button" @click.stop="markAsRead(item.id)">
                  Marcar leída
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

export default {
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
      return JSON.parse(localStorage.getItem('user') || '{}')
    }
  },

  watch: {
    '$route.query.id': {
      immediate: true,
      handler(newId) {
        if (!newId) return

        const id = Number(newId)

        if (!id) return

        this.expandedNotification = String(id)
        this.markAsRead(id)
      }
    }
  },

  methods: {
    authConfig() {
      return {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    },

    goToNotification(item) {
      const id = String(item.id)
      const isOpen = this.expandedNotification === id

      if (isOpen) {
        this.expandedNotification = null
        this.markAsRead(id)
        return
      }

      this.expandedNotification = id

      this.$router.push({
        path: '/notifications-history',
        query: { id }
      })
    },

    toggleNotification(id) {
      this.expandedNotification =
        this.expandedNotification === id ? null : String(id)
    },

   async markAsRead(id) {
  try {
    const parsedId = Number(id)
    if (!parsedId) return

    await axios.post(
      `${API_BASE_URL}/maintenance/notifications/read`,
      { ids: [parsedId] },
      this.authConfig()
    )

    this.items = this.items.map(item => {
      const itemId = Number(item.id)

      return {
        ...item,
        read: itemId === parsedId ? true : item.read
      }
    })
console.log("ITEMS:", this.items)
    this.expandedNotification = null

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
        success: 'Exito',
        warning: 'Atención',
        error: 'Urgente',
        info: 'Info'
      }

      return map[value] || 'Info'
    }
  },

  mounted() {
    const id = this.$route.query.id

    if (id) {
      this.expandedNotification = String(id)
      this.markAsRead(id)
    }

    document.body.style.background =
      'linear-gradient(180deg, rgb(248, 248, 252), rgb(69, 82, 28))'
    document.body.style.backgroundAttachment = 'fixed'

    const user = JSON.parse(localStorage.getItem('user') || '{}')
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

  padding: 2rem;

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
  margin-top: 5.4rem;
  padding: 1.2rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
}

.container {
  width: 100%;
  display: flex;
  justify-content: center;
}

.notification-history-card {
  width: min(1080px, 100%);
  margin: 5.4rem auto 0;
  text-align: center;
}

.notification-history-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.notification-history-actions {
  justify-content: center;
  flex-wrap: wrap;
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
  width: 180px;
}

.notification-history-filters button {
  width: auto;
  padding: 0.62rem 1.5rem;
}

.notification-history-summary article {
  text-align: center;
  justify-items: center;
}

.notification-history-filters input,
.notification-history-filters select,
.notification-history-filters button,
.ghost-button,
.mark-read-button {
  border: 0;
  border-radius: 12px;
  padding: 0.62rem 0.8rem;
}

.notification-history-filters input,
.notification-history-filters select {
  background: #f1f0ed;
}

.notification-history-filters button,
.mark-read-button {
  background: #6b8e3a;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.ghost-button {
  background: #f1f0ed;
  color: #2d3d24;
  cursor: pointer;
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
  .notification-history-card {
    margin-top: 0.8rem;
    margin-bottom: 5rem;
  }

  .notification-history-header {
    flex-direction: column;
  }

  .notification-history-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .notification-history-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .notification-history-filters button {
    grid-column: span 2;
  }

  .notification-history-summary {
    grid-template-columns: repeat(1, minmax(0, 1fr));
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
</style>
