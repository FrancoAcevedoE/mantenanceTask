/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching'
import { NavigationRoute, registerRoute } from 'workbox-routing'

self.skipWaiting()
clientsClaim()
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()
registerRoute(new NavigationRoute(createHandlerBoundToURL('index.html')))

self.addEventListener('push', event => {
  const payload = event.data?.json?.() || {}
  const title = payload.title || 'Nueva notificacion'

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || 'Tienes una alerta nueva',
      icon: payload.icon || '/pwa-192.png',
      badge: payload.badge || '/pwa-192.png',
      tag: payload.tag || 'maintenance-notification',
      data: {
        url: payload.url || '/dashboard',
        ...payload.data
      }
    })
  )
})

self.addEventListener('notificationclick', event => {
  event.notification.close()

  event.waitUntil((async () => {
    const targetUrl = new URL(event.notification.data?.url || '/dashboard', self.location.origin).href
    const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })

    for (const client of clientList) {
      if (client.url === targetUrl && 'focus' in client) {
        return client.focus()
      }
    }

    if (self.clients.openWindow) {
      return self.clients.openWindow(targetUrl)
    }
  })())
})