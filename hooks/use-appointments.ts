'use client'

import { useEffect, useState } from 'react'
import { STORAGE_CHANGED_EVENT, getTodayAppointments } from '@/lib/storage'

export function useTodayAppointmentsCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const refresh = () => {
      getTodayAppointments().then((appointments) => {
        setCount(appointments.filter((a) => a.status === 'scheduled').length)
      })
    }

    refresh()

    // Listen for storage changes
    const handleStorage = () => {
      refresh()
    }

    window.addEventListener(STORAGE_CHANGED_EVENT, handleStorage)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(STORAGE_CHANGED_EVENT, handleStorage)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  return count
}
