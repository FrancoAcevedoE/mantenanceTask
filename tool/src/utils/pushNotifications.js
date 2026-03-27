import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index)
  }

  return outputArray
}

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

export const isPushSupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export const getPushPublicKey = async () => {
  const response = await axios.get(`${API_BASE_URL}/users/push/public-key`, authConfig())
  return response.data
}

export const getCurrentPushSubscription = async () => {
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export const subscribeToPush = async () => {
  const pushConfig = await getPushPublicKey()

  if (!pushConfig.enabled || !pushConfig.publicKey) {
    throw new Error('Push web no configurado en el servidor')
  }

  const registration = await navigator.serviceWorker.ready
  const existingSubscription = await registration.pushManager.getSubscription()

  if (existingSubscription) {
    return existingSubscription
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(pushConfig.publicKey)
  })

  await axios.post(
    `${API_BASE_URL}/users/push/subscribe`,
    {
      subscription: subscription.toJSON()
    },
    authConfig()
  )

  return subscription
}

export const unsubscribeFromPush = async () => {
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    return false
  }

  await axios.delete(`${API_BASE_URL}/users/push/subscribe`, {
    ...authConfig(),
    data: {
      endpoint: subscription.endpoint
    }
  })

  await subscription.unsubscribe()
  return true
}