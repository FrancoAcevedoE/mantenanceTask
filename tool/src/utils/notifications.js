const TYPE_OPTIONS = {
  success: {
    timeout: 3000,
    toastClassName: 'app-toast app-toast--success'
  },
  error: {
    timeout: 4200,
    toastClassName: 'app-toast app-toast--error'
  },
  warning: {
    timeout: 3800,
    toastClassName: 'app-toast app-toast--warning'
  }
}

function normalizeMessage(message, fallback = 'Ocurrio un error inesperado') {
  if (typeof message === 'string' && message.trim()) {
    return message
  }

  return fallback
}

function extractApiErrorMessage(error) {
  const responseData = error?.response?.data

  if (typeof responseData === 'string' && responseData.trim()) {
    return responseData
  }

  if (responseData && typeof responseData === 'object') {
    if (typeof responseData.message === 'string' && responseData.message.trim()) {
      return responseData.message
    }

    if (typeof responseData.error === 'string' && responseData.error.trim()) {
      return responseData.error
    }
  }

  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message
  }

  return ''
}

export function createNotifier(toastInstance) {
  const show = (type, message, options = {}) => {
    if (!toastInstance || typeof toastInstance[type] !== 'function') {
      return
    }

    const defaultOptions = TYPE_OPTIONS[type] || {}

    toastInstance[type](normalizeMessage(message), {
      ...defaultOptions,
      ...options
    })
  }

  return {
    success(message, options = {}) {
      show('success', message, options)
    },
    error(message, options = {}) {
      show('error', message, options)
    },
    warning(message, options = {}) {
      show('warning', message, options)
    },
    notifyApiError(error, fallback = 'Ocurrio un error inesperado', options = {}) {
      const message = extractApiErrorMessage(error)
      show('error', message || fallback, options)
    }
  }
}
