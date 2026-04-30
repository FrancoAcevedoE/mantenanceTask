import { defineStore } from 'pinia'
import axios from 'axios'
import {
  getCurrentPushSubscription,
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush
} from '@/utils/pushNotifications'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
const POLL_INTERVAL_MS = 60000

const buildSystemNotificationBody = (item) => {
  const detailParts = [item.message, item.sector ? `Sector: ${item.sector}` : '', item.operator ? `Operario: ${item.operator}` : '']
    .filter(Boolean)

  return detailParts.join(' | ')
}

export const useNotificationsStore = defineStore('notifications', {
  state: () => ({
    items: [],
    summary: {
      stoppedMachinesCount: 0,
      pendingMaintenancesCount: 0,
      totalActive: 0
    },
    isLoading: false,
    isPanelOpen: false,
    initialized: false,
    browserPermission: typeof window !== 'undefined' && 'Notification' in window
      ? window.Notification.permission
      : 'unsupported',
    readIds: [],
    pollTimerId: null,
    knownItemIds: [],
    visibilityHandler: null,
    pushSupported: typeof window !== 'undefined' ? isPushSupported() : false,
    pushEnabled: false,
    pushLoading: false
  }),

  getters: {
    unreadCount(state) {
      return state.items.filter(item => !state.readIds.includes(item.id)).length
    },

    hasBrowserNotificationsSupport(state) {
      return state.browserPermission !== 'unsupported'
    },

    hasPushSupport(state) {
      return state.pushSupported
    }
  },

  actions: {
    authConfig() {
      const token = localStorage.getItem('token')

      return {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    },

    async fetchNotifications({ silent = false } = {}) {
      if (!localStorage.getItem('token')) {
        this.reset()
        return
      }

      // No cargar notificaciones de mantenimiento para vendedores
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      if (user.role === 'vendedor') {
        this.initialized = true
        return
      }

      if (!silent) {
        this.isLoading = true
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/maintenance/notifications`, this.authConfig())
        const payload = response.data || {}
        const nextItems = Array.isArray(payload.items) ? payload.items : []
        const previousKnownIds = new Set(this.knownItemIds)
        const newItems = this.initialized
          ? nextItems.filter(item => !previousKnownIds.has(item.id))
          : []

        this.items = nextItems
        this.summary = payload.summary || {
          stoppedMachinesCount: 0,
          pendingMaintenancesCount: 0,
          totalActive: 0
        }
        this.knownItemIds = nextItems.map(item => item.id)
          this.readIds = Array.isArray(payload.readIds) ? payload.readIds : []

        this.initialized = true
        this.notifyNewItems(newItems)
      } finally {
        this.isLoading = false
      }
    },

    async initialize() {
      if (this.pollTimerId) {
        return
      }

      this.browserPermission = typeof window !== 'undefined' && 'Notification' in window
        ? window.Notification.permission
        : 'unsupported'
      await this.syncPushStatus()

      await this.fetchNotifications()

      if (!this.visibilityHandler) {
        this.visibilityHandler = () => {
          if (document.visibilityState === 'visible') {
            this.fetchNotifications({ silent: true }).catch(() => {})
          }
        }
      }

      this.pollTimerId = window.setInterval(() => {
        this.fetchNotifications({ silent: true }).catch(() => {})
      }, POLL_INTERVAL_MS)

      document.addEventListener('visibilitychange', this.visibilityHandler)
    },

    stop() {
      if (this.pollTimerId) {
        window.clearInterval(this.pollTimerId)
        this.pollTimerId = null
      }

      if (this.visibilityHandler) {
        document.removeEventListener('visibilitychange', this.visibilityHandler)
      }
    },

    reset() {
      this.stop()
      this.items = []
      this.summary = {
        stoppedMachinesCount: 0,
        pendingMaintenancesCount: 0,
        totalActive: 0
      }
      this.isLoading = false
      this.isPanelOpen = false
      this.initialized = false
      this.knownItemIds = []
      this.readIds = []
      this.pushEnabled = false
      this.pushLoading = false
    },

    togglePanel() {
      this.isPanelOpen = !this.isPanelOpen
    },

    closePanel() {
      this.isPanelOpen = false
    },

    async persistReadIds(ids) {
      const normalizedIds = Array.isArray(ids)
        ? [...new Set(ids.map(item => String(item || '').trim()).filter(Boolean))]
        : []

      if (!normalizedIds.length) {
        return
      }

      await axios.post(
        `${API_BASE_URL}/maintenance/notifications/read`,
        { ids: normalizedIds },
        this.authConfig()
      )
    },

    async markAllAsRead() {
      const nextReadIds = this.items.map(item => item.id)
      this.readIds = [...new Set(nextReadIds)]
      await this.persistReadIds(this.readIds)
    },

    async markAsRead(notificationId) {
      const normalizedNotificationId = String(notificationId || '').trim()

      if (!normalizedNotificationId || this.readIds.includes(normalizedNotificationId)) {
        return
      }

      this.readIds = [...this.readIds, normalizedNotificationId]
      await this.persistReadIds([normalizedNotificationId])
    },

    async requestBrowserPermission() {
      if (!this.hasBrowserNotificationsSupport) {
        return false
      }

      const permission = await window.Notification.requestPermission()
      this.browserPermission = permission
      return permission === 'granted'
    },

    async syncPushStatus() {
      if (!this.pushSupported || !localStorage.getItem('token')) {
        this.pushEnabled = false
        return false
      }

      const subscription = await getCurrentPushSubscription()
      this.pushEnabled = Boolean(subscription)
      return this.pushEnabled
    },

    async enablePushNotifications() {
      if (!this.pushSupported) {
        throw new Error('Este dispositivo no soporta push web')
      }

      this.pushLoading = true

      try {
        if (window.Notification.permission !== 'granted') {
          const permissionGranted = await this.requestBrowserPermission()

          if (!permissionGranted) {
            throw new Error('Debes permitir las notificaciones del navegador')
          }
        }

        await subscribeToPush()
        this.pushEnabled = true
        return true
      } finally {
        this.pushLoading = false
      }
    },

    async disablePushNotifications() {
      if (!this.pushSupported) {
        return false
      }

      this.pushLoading = true

      try {
        await unsubscribeFromPush()
        this.pushEnabled = false
        return true
      } finally {
        this.pushLoading = false
      }
    },

    notifyNewItems(newItems) {
      if (this.browserPermission !== 'granted' || !Array.isArray(newItems) || !newItems.length) {
        return
      }

      newItems.slice(0, 3).forEach(item => {
        const notification = new window.Notification(item.title, {
          body: buildSystemNotificationBody(item),
          tag: item.id
        })

        notification.onclick = () => {
          window.focus()
          this.isPanelOpen = true
          this.markAsRead(item.id)
        }
      })
    }
  }
})