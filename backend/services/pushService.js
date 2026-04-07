import webpush from "web-push"
import User from "../models/userModels.js"

let pushConfigCache = null

const getPushConfig = () => {
  if (pushConfigCache) {
    return pushConfigCache
  }

  const publicKey = String(process.env.WEB_PUSH_PUBLIC_KEY || "").trim()
  const privateKey = String(process.env.WEB_PUSH_PRIVATE_KEY || "").trim()
  const subject = String(process.env.WEB_PUSH_SUBJECT || "mailto:admin@mantenance.app").trim()
  const enabled = Boolean(publicKey && privateKey && subject)

  if (enabled) {
    webpush.setVapidDetails(subject, publicKey, privateKey)
  }

  pushConfigCache = {
    enabled,
    publicKey,
    privateKey,
    subject
  }

  return pushConfigCache
}

const normalizeSubscription = (subscription = {}) => {
  const endpoint = String(subscription.endpoint || "").trim()
  const expirationTime = subscription.expirationTime ?? null
  const keys = {
    auth: String(subscription?.keys?.auth || "").trim(),
    p256dh: String(subscription?.keys?.p256dh || "").trim()
  }

  if (!endpoint || !keys.auth || !keys.p256dh) {
    return null
  }

  return {
    endpoint,
    expirationTime,
    keys
  }
}

const buildPushPayload = (payload = {}) => ({
  title: String(payload.title || "Nueva notificacion").trim(),
  body: String(payload.body || "Tienes una novedad en mantenciones").trim(),
  tag: String(payload.tag || "maintenance-alert").trim(),
  url: String(payload.url || "/dashboard").trim(),
  icon: "/pwa-192.png",
  badge: "/pwa-192.png",
  data: payload.data || {}
})

export const getPushPublicConfig = () => ({
  enabled: getPushConfig().enabled,
  publicKey: getPushConfig().enabled ? getPushConfig().publicKey : ""
})

export const saveUserPushSubscription = async (userId, subscription) => {
  const normalizedSubscription = normalizeSubscription(subscription)

  if (!normalizedSubscription) {
    throw new Error("Suscripcion push invalida")
  }

  await User.updateMany(
    { "pushSubscriptions.endpoint": normalizedSubscription.endpoint },
    {
      $pull: {
        pushSubscriptions: {
          endpoint: normalizedSubscription.endpoint
        }
      }
    }
  )

  await User.updateOne(
    { _id: userId },
    {
      $push: {
        pushSubscriptions: {
          ...normalizedSubscription,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    }
  )

  return normalizedSubscription
}

export const removeUserPushSubscription = async (userId, endpoint) => {
  const normalizedEndpoint = String(endpoint || "").trim()

  if (!normalizedEndpoint) {
    throw new Error("Endpoint de suscripcion invalido")
  }

  await User.updateOne(
    { _id: userId },
    {
      $pull: {
        pushSubscriptions: {
          endpoint: normalizedEndpoint
        }
      }
    }
  )
}

export const sendPushNotificationToAllUsers = async (payload = {}) => {
  if (!getPushConfig().enabled) {
    return {
      ok: false,
      reason: "push-not-configured",
      sent: 0,
      failed: 0
    }
  }

  const users = await User.find({ isDeleted: { $ne: true }, "pushSubscriptions.0": { $exists: true } }).select("pushSubscriptions").lean()
  const normalizedPayload = buildPushPayload(payload)
  let sent = 0
  let failed = 0

  for (const user of users) {
    const subscriptions = Array.isArray(user.pushSubscriptions) ? user.pushSubscriptions : []

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(subscription, JSON.stringify(normalizedPayload))
        sent += 1
      } catch (error) {
        failed += 1

        if (error.statusCode === 404 || error.statusCode === 410) {
          await User.updateOne(
            { _id: user._id },
            {
              $pull: {
                pushSubscriptions: {
                  endpoint: subscription.endpoint
                }
              }
            }
          )
        }
      }
    }
  }

  return {
    ok: true,
    sent,
    failed
  }
}