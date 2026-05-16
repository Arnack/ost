'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'

const SERVICE_WORKER_PATH = '/sw.js'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

export function PWARegister() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

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

  useEffect(() => {
    let startY = 0
    let isPullingDown = false

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY
        isPullingDown = true
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (isPullingDown && window.scrollY === 0) {
        const currentY = e.touches[0].clientY
        if (currentY > startY && currentY - startY > 50) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = () => {
      isPullingDown = false
      startY = 0
    }

    const preventDefaultPullToRefresh = () => {
      document.body.style.overscrollBehavior = 'none'
      document.documentElement.style.overscrollBehavior = 'none'
    }

    preventDefaultPullToRefresh()
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      return
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isIosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true

    if (isStandalone || isIosStandalone) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    const handleAppInstalled = () => {
      setInstallPrompt(null)
      setIsInstalled(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) {
      return
    }

    await installPrompt.prompt()
    const choice = await installPrompt.userChoice

    if (choice.outcome === 'accepted') {
      setIsInstalled(true)
    }

    setInstallPrompt(null)
  }

  if (!installPrompt || isInstalled) {
    return null
  }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="fixed bottom-4 right-4 z-50 flex min-h-11 items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Download className="h-4 w-4" />
      Установить приложение
    </button>
  )
}
