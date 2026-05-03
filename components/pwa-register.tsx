'use client'

import { useEffect } from 'react'

const SERVICE_WORKER_PATH = '/sw.js'

export function PWARegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    if (!('serviceWorker' in navigator)) {
      return
    }

    const registerServiceWorker = () => {
      navigator.serviceWorker.register(SERVICE_WORKER_PATH).catch(() => undefined)
    }

    if (document.readyState === 'complete') {
      registerServiceWorker()
      return
    }

    window.addEventListener('load', registerServiceWorker, { once: true })

    return () => {
      window.removeEventListener('load', registerServiceWorker)
    }
  }, [])

  return null
}
