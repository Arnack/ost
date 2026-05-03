'use client'

import { useEffect, useState } from 'react'
import { getTodayAppointments } from '@/lib/storage'

export function useTodayAppointmentsCount(): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const appointments = getTodayAppointments()
    setCount(appointments.filter((a) => a.status === 'scheduled').length)

    // Listen for storage changes
    const handleStorage = () => {
      const updated = getTodayAppointments()
      setCount(updated.filter((a) => a.status === 'scheduled').length)
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return count
}
