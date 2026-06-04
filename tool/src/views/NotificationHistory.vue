<template>
  <div class="page-container">
    <div class="container">
      <div class="notification-history-card">

        <!-- HEADER -->
        <header class="notification-history-header">
          <p>HISTORIAL DE NOTIFICACIONES</p>

          <div class="notification-history-actions">
            <button
              type="button"
              class="ghost-button"
              @click="markVisibleAsRead"
              :disabled="isLoading || !hasUnreadVisible"
            >
              Marcar visibles como leídas
            </button>

            <button
              type="button"
              class="ghost-button"
              @click="clearReadFilter"
              :disabled="isLoading"
            >
              Limpiar leídas
            </button>
          </div>
        </header>

        <!-- RESTRICCIÓN ROL -->
        <div v-if="currentUser?.role === 'vendedor'" class="seller-message">
          <p>Como vendedor no tenés acceso al historial.</p>
          <button @click="$router.push('/seller')">Ir a Cotizaciones</button>
        </div>

        <div v-else>

          <!-- FILTROS -->
          <section class="notification-history-filters">
            <select v-model="readFilter">
              <option value="all">Todas</option>
              <option value="unread">No leídas</option>
              <option value="read">Leídas</option>
            </select>

            <input v-model="fromDate" type="date" />
            <input v-model="toDate" type="date" />
            <input v-model="searchText" type="text" placeholder="Buscar..." />

            <button @click="loadHistory" :disabled="isLoading">
              Aplicar filtros
            </button>
          </section>

          <!-- SUMMARY -->
          <section class="notification-history-summary">
            <article>
              <strong>{{ summary.total }}</strong>
              <span>Total</span>
            </article>
            <article>
              <strong>{{ summary.unread }}</strong>
              <span>No leídas</span>
            </article>
            <article>
              <strong>{{ summary.read }}</strong>
              <span>Leídas</span>
            </article>
          </section>

          <p v-if="isLoading" class="state-text">Cargando...</p>

          <p v-else-if="!filteredItems.length" class="state-text">
            No hay notificaciones.
          </p>

          <!-- SPLIT VIEW -->
          <div v-else class="split-view">

            <!-- LISTA IZQUIERDA -->
            <ul class="history-list">

              <li
                v-for="item in filteredItems"
                :key="item.id"
                :class="[
                  'history-item',
                  item.read ? 'read' : 'unread',
                  expandedNotification === item.id ? 'active' : ''
                ]"
                @click="selectNotification(item)"
              >
                <div class="notification-title">
                  {{ item.title }}
                </div>

                <div class="notification-preview">
                  {{ item.body }}
                </div>

                <span class="notification-date">
                  {{ formatDate(item.createdAt) }}
                </span>
              </li>

            </ul>

            <!-- PANEL DERECHO (DETALLE) -->
            <div class="notification-detail-panel" v-if="selectedNotification">

              <h2>{{ selectedNotification.title }}</h2>

              <pre class="notification-text">
                {{ selectedNotification.body }}
              </pre>

              <div v-if="selectedNotification.machine">
                <strong>Máquina:</strong> {{ selectedNotification.machine }}
              </div>

              <div v-if="selectedNotification.sector">
                <strong>Sector:</strong> {{ selectedNotification.sector }}
              </div>

              <div>
                <strong>Estado:</strong>
                {{ selectedNotification.read ? 'Leída' : 'No leída' }}
              </div>

              <button
                v-if="!selectedNotification.read"
                class="mark-read-button"
                @click="markAsRead(selectedNotification.id)"
              >
                Marcar como leída
              </button>

            </div>

          </div>

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
      selectedNotification: null,
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

      if (!query) {
        return this.items
      }

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

  methods: {
    authConfig() {
      return {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    },
    goToNotification(item) {
      this.$router.push({
        path: '/notifications',
        query: { id: item.id }
      })
    },
    selectNotification(item) {
      this.selectedNotification = item
      this.expandedNotification = item.id

      if (!item.read) {
        this.markAsRead(item.id)
      }
    },
    toggleNotification(id) {
      this.expandedNotification =
        this.expandedNotification === id ? null : id
    },
    async markAsRead(id) {
      try {
        await axios.post(
          `${API_BASE_URL}/maintenance/notifications/read`,
          { ids: [id] },
          this.authConfig()
        )

        // actualizar UI local si existe en lista
        if (this.items) {
          this.items = this.items.map(item =>
            item.id === id ? { ...item, read: true } : item
          )
        }
      } catch (error) {
        this.$notify.notifyApiError(error, 'No se pudo marcar como leída')
      }
    },
    buildHistoryQuery() {
      const params = new URLSearchParams()

      if (this.readFilter && this.readFilter !== 'all') {
        params.set('read', this.readFilter)
      }

      if (this.fromDate) {
        params.set('from', this.fromDate)
      }

      if (this.toDate) {
        params.set('to', this.toDate)
      }

      const rawQuery = params.toString()
      return rawQuery ? `?${rawQuery}` : ''
    },

    async loadHistory() {
      this.isLoading = true

      try {
        const response = await axios.get(
          `${API_BASE_URL}/maintenance/notifications/history${this.buildHistoryQuery()}`,
          this.authConfig()
        )

        this.items = Array.isArray(response.data?.items) ? response.data.items : []
        this.summary = response.data?.summary || {
          total: this.items.length,
          read: this.items.filter(item => item.read).length,
          unread: this.items.filter(item => !item.read).length
        }
      } catch (error) {
        this.$notify.notifyApiError(error, 'No se pudo cargar el historial de notificaciones')
      } finally {
        this.isLoading = false
      }
    },

    // async markAsRead(notificationId) {
    //   try {
    //     await axios.post(
    //       `${API_BASE_URL}/maintenance/notifications/history/read`,
    //       {
    //         ids: [notificationId]
    //       },
    //       this.authConfig()
    //     )

    //     this.items = this.items.map(item => item.id === notificationId ? { ...item, read: true } : item)
    //     this.summary.read += 1
    //     this.summary.unread = Math.max(0, this.summary.unread - 1)
    //   } catch (error) {
    //     this.$notify.notifyApiError(error, 'No se pudo marcar como leida')
    //   }
    // },

    async markVisibleAsRead() {
      const unreadVisibleIds = this.filteredItems.filter(item => !item.read).map(item => item.id)

      if (!unreadVisibleIds.length) {
        return
      }

      try {
        await axios.post(
          `${API_BASE_URL}/maintenance/notifications/history/read`,
          {
            ids: unreadVisibleIds
          },
          this.authConfig()
        )

        const unreadSet = new Set(unreadVisibleIds)
        this.items = this.items.map(item => unreadSet.has(item.id) ? { ...item, read: true } : item)
        this.summary.read += unreadVisibleIds.length
        this.summary.unread = Math.max(0, this.summary.unread - unreadVisibleIds.length)
      } catch (error) {
        this.$notify.notifyApiError(error, 'No se pudieron marcar las notificaciones visibles')
      }
    },

    async clearReadFilter() {
      try {
        await axios.delete(
          `${API_BASE_URL}/maintenance/notifications/history/read`,
          this.authConfig()
        )

        this.items = this.items.map(item => ({ ...item, read: false }))
        this.summary.read = 0
        this.summary.unread = this.items.length
      } catch (error) {
        this.$notify.notifyApiError(error, 'No se pudo limpiar el estado de leidas')
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
        warning: 'Atencion',
        error: 'Urgente',
        info: 'Info'
      }

      return map[value] || 'Info'
    }
  },

  mounted() {

    const id = this.$route.query.id

    if (id) {
      // this.openNotification(id)
      this.expandedNotification = id
      this.markAsRead(id)
    }
    document.body.style.background = 'linear-gradient(180deg, rgb(248, 248, 252), rgb(69, 82, 28))'

    // No cargar historial de notificaciones de mantenimiento para vendedores
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    if (user.role === 'vendedor') {
      return
    }
    this.loadHistory()
  },

  beforeUnmount() {
    document.body.style.background = ''
  }
}
</script>

<style scoped>
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
.split-view {
  display: flex;
  height: 70vh;
  gap: 1rem;
}

.list-pane {
  width: 40%;
  overflow-y: auto;
  border-right: 1px solid #e5e7eb;
  padding-right: 0.5rem;
}

.detail-pane {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.detail-card {
  background: #fff;
  border-radius: 12px;
  padding: 1rem;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

.history-item.active {
  background: #f3f7ec;
  border-left: 4px solid #6b8e3a;
}

.empty-state {
  color: #888;
  padding: 2rem;
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
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
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
  gap: 0.7rem;
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
