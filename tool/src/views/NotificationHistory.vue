<template>
  <div class="notification-history-page">
    <div class="notification-history-card">
      <header class="notification-history-header">
        <div>
          <p>Historial de notificaciones</p>
          <h1>Centro historico</h1>
        </div>
        <div class="notification-history-actions">
          <button type="button" class="ghost-button" @click="markVisibleAsRead" :disabled="isLoading || !hasUnreadVisible">
            Marcar visibles como leidas
          </button>
          <button type="button" class="ghost-button" @click="clearReadFilter" :disabled="isLoading">
            Limpiar leidas
          </button>
        </div>
      </header>

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
      <p v-else-if="!filteredItems.length" class="state-text">No hay notificaciones para los filtros seleccionados.</p>

      <ul v-else class="history-list">
        <li v-for="item in filteredItems" :key="item.id" :class="['history-item', item.read ? 'read' : 'unread']">
          <div class="history-item-top">
            <div>
              <h3>{{ item.title }}</h3>
              <p>{{ item.body }}</p>
            </div>
            <span :class="['severity-badge', `severity-${item.severity || 'info'}`]">
              {{ formatSeverity(item.severity) }}
            </span>
          </div>

          <div class="history-item-meta">
            <span>{{ formatDate(item.createdAt) }}</span>
            <span v-if="item.machine">{{ item.machine }}</span>
            <span v-if="item.sector">{{ item.sector }}</span>
            <span>{{ item.read ? 'Leida' : 'No leida' }}</span>
          </div>

          <button
            v-if="!item.read"
            type="button"
            class="mark-read-button"
            @click="markAsRead(item.id)"
            :disabled="isLoading"
          >
            Marcar leida
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import backgroundImage from '@/assets/fondogeneral.png'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

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
      backgroundImage
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

    async markAsRead(notificationId) {
      try {
        await axios.post(
          `${API_BASE_URL}/maintenance/notifications/history/read`,
          {
            ids: [notificationId]
          },
          this.authConfig()
        )

        this.items = this.items.map(item => item.id === notificationId ? { ...item, read: true } : item)
        this.summary.read += 1
        this.summary.unread = Math.max(0, this.summary.unread - 1)
      } catch (error) {
        this.$notify.notifyApiError(error, 'No se pudo marcar como leida')
      }
    },

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
    document.body.style.backgroundImage = `url(${this.backgroundImage})`
    document.body.style.backgroundSize = 'cover'
    document.body.style.backgroundPosition = 'center'
    document.body.style.backgroundRepeat = 'no-repeat'
    document.body.style.backgroundAttachment = 'fixed'

    this.loadHistory()
  },

  beforeUnmount() {
    document.body.style.backgroundImage = ''
    document.body.style.backgroundSize = ''
    document.body.style.backgroundPosition = ''
    document.body.style.backgroundRepeat = ''
    document.body.style.backgroundAttachment = ''
  }
}
</script>

<style scoped>
.notification-history-page {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.notification-history-card {
  width: min(1080px, 100%);
  margin-top: 5.4rem;
  padding: 1.2rem;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 48px rgba(15, 23, 42, 0.2);
}

.notification-history-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.notification-history-header p,
.notification-history-header h1 {
  margin: 0;
}

.notification-history-header p {
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.75rem;
}

.notification-history-actions {
  display: flex;
  gap: 0.5rem;
}

.notification-history-filters {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.6rem;
  margin-bottom: 1rem;
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
  background: #f1f5f9;
}

.notification-history-filters button,
.mark-read-button {
  background: #0369a1;
  color: #fff;
  font-weight: 600;
  cursor: pointer;
}

.ghost-button {
  background: #e2e8f0;
  color: #0f172a;
  cursor: pointer;
}

.notification-history-summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.7rem;
  margin-bottom: 1rem;
}

.notification-history-summary article {
  background: #f8fafc;
  border-radius: 14px;
  padding: 0.8rem;
  display: grid;
}

.notification-history-summary strong {
  font-size: 1.35rem;
}

.state-text {
  color: #475569;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.7rem;
}

.history-item {
  border-radius: 16px;
  padding: 0.95rem;
  border: 1px solid rgba(148, 163, 184, 0.25);
  background: #ffffff;
}

.history-item.unread {
  border-left: 5px solid #0369a1;
}

.history-item.read {
  border-left: 5px solid #94a3b8;
  opacity: 0.9;
}

.history-item-top {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.history-item-top h3,
.history-item-top p {
  margin: 0;
}

.history-item-top p {
  color: #334155;
  margin-top: 0.2rem;
}

.history-item-meta {
  margin-top: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  color: #64748b;
  font-size: 0.86rem;
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
  background: #ccfbf1;
  color: #115e59;
}

.severity-info {
  background: #dbeafe;
  color: #1e3a8a;
}

.mark-read-button {
  margin-top: 0.65rem;
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
</style>
