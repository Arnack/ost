// OsteoTab CRM - localStorage Abstraction

import type { Client, Appointment, Settings, Payment } from './types'
import { normalizeClient, normalizePayment } from './types'

const STORAGE_KEYS = {
  CLIENTS: 'osteotab_clients',
  APPOINTMENTS: 'osteotab_appointments',
  PAYMENTS: 'osteotab_payments',
  SETTINGS: 'osteotab_settings',
} as const

// Generic storage helpers
function getItem<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch {
    return defaultValue
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`[v0] Error saving to localStorage:`, error)
  }
}

// Client operations
export function getClients(): Client[] {
  return getItem<Client[]>(STORAGE_KEYS.CLIENTS, []).map(normalizeClient)
}

export function setClients(clients: Client[]): void {
  setItem(STORAGE_KEYS.CLIENTS, clients)
}

export function getClient(id: string): Client | undefined {
  const clients = getClients()
  return clients.find((c) => c.id === id)
}

export function saveClient(client: Client): void {
  const clients = getClients()
  const index = clients.findIndex((c) => c.id === client.id)
  if (index >= 0) {
    clients[index] = client
  } else {
    clients.push(client)
  }
  setClients(clients)
}

export function deleteClient(id: string): void {
  const clients = getClients()
  setClients(clients.filter((c) => c.id !== id))
}

// Appointment operations
export function getAppointments(): Appointment[] {
  return getItem<Appointment[]>(STORAGE_KEYS.APPOINTMENTS, [])
}

export function setAppointments(appointments: Appointment[]): void {
  setItem(STORAGE_KEYS.APPOINTMENTS, appointments)
}

export function getAppointment(id: string): Appointment | undefined {
  const appointments = getAppointments()
  return appointments.find((a) => a.id === id)
}

export function saveAppointment(appointment: Appointment): void {
  const appointments = getAppointments()
  const index = appointments.findIndex((a) => a.id === appointment.id)
  if (index >= 0) {
    appointments[index] = appointment
  } else {
    appointments.push(appointment)
  }
  setAppointments(appointments)
}

export function deleteAppointment(id: string): void {
  const appointments = getAppointments()
  setAppointments(appointments.filter((a) => a.id !== id))
}

export function getAppointmentsForDate(date: string): Appointment[] {
  const appointments = getAppointments()
  return appointments.filter((a) => a.date.startsWith(date))
}

export function getTodayAppointments(): Appointment[] {
  const today = new Date().toISOString().split('T')[0]
  return getAppointmentsForDate(today)
}

// Payment operations
export function getPayments(): Payment[] {
  return getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, []).map(normalizePayment)
}

export function setPayments(payments: Payment[]): void {
  setItem(STORAGE_KEYS.PAYMENTS, payments)
}

export function getPayment(id: string): Payment | undefined {
  const payments = getPayments()
  return payments.find((p) => p.id === id)
}

export function addPayment(payment: Payment): void {
  const payments = getPayments()
  payments.push(payment)
  setPayments(payments)
}

export function updatePayment(payment: Payment): void {
  const payments = getPayments()
  const index = payments.findIndex((p) => p.id === payment.id)
  if (index >= 0) {
    payments[index] = payment
    setPayments(payments)
  }
}

export function deletePayment(id: string): void {
  const payments = getPayments()
  setPayments(payments.filter((p) => p.id !== id))
}

export function clearOsteoData(): void {
  setClients([])
  setAppointments([])
  setPayments([])
  saveSettings(defaultSettings)
}

// Settings operations
const defaultSettings: Settings = {
  gigaChatModel: 'GigaChat',
  defaultSessionDuration: 60,
  defaultSessionCost: 5000,
}

export function getSettings(): Settings {
  return {
    ...defaultSettings,
    ...getItem<Settings>(STORAGE_KEYS.SETTINGS, defaultSettings),
  }
}

export function saveSettings(settings: Settings): void {
  setItem(STORAGE_KEYS.SETTINGS, settings)
}

// Search clients
export function searchClients(query: string): Client[] {
  const clients = getClients()
  const q = query.toLowerCase().trim()
  if (!q) return clients
  return clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
  )
}

// Get clients sorted by last visit
export function getClientsSortedByLastVisit(): Client[] {
  const clients = getClients()
  return [...clients].sort(
    (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
  )
}

// Export/Import for backup
export function exportData(): string {
  return JSON.stringify({
    clients: getClients(),
    appointments: getAppointments(),
    payments: getPayments(),
    settings: getSettings(),
    exportDate: new Date().toISOString(),
  }, null, 2)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isSettings(value: unknown): value is Settings {
  return isRecord(value)
    && typeof value.defaultSessionDuration === 'number'
    && typeof value.defaultSessionCost === 'number'
    && (value.claudeApiKey === undefined || typeof value.claudeApiKey === 'string')
    && (value.gigaChatApiKey === undefined || typeof value.gigaChatApiKey === 'string')
    && (value.gigaChatModel === undefined || typeof value.gigaChatModel === 'string')
}

export function importData(jsonString: string): boolean {
  try {
    const data: unknown = JSON.parse(jsonString)

    if (!isRecord(data)) return false

    const clients = data.clients
    const appointments = data.appointments
    const payments = data.payments
    const settings = data.settings
    const hasKnownData = Array.isArray(clients)
      || Array.isArray(appointments)
      || Array.isArray(payments)
      || isSettings(settings)

    if (!hasKnownData) return false

    if (clients !== undefined && !Array.isArray(clients)) return false
    if (appointments !== undefined && !Array.isArray(appointments)) return false
    if (payments !== undefined && !Array.isArray(payments)) return false
    if (settings !== undefined && !isSettings(settings)) return false

    setClients(Array.isArray(clients) ? clients.map((client) => normalizeClient(client as Client)) : [])
    setAppointments(Array.isArray(appointments) ? appointments as Appointment[] : [])
    setPayments(Array.isArray(payments) ? payments.map((payment) => normalizePayment(payment as Payment)) : [])
    saveSettings(isSettings(settings) ? settings : defaultSettings)

    return true
  } catch {
    return false
  }
}

// Storage object for components that prefer object syntax
export const storage = {
  getClients,
  setClients,
  getClient,
  saveClient,
  deleteClient,
  getAppointments,
  setAppointments,
  getAppointment,
  saveAppointment,
  deleteAppointment,
  getAppointmentsForDate,
  getTodayAppointments,
  getPayments,
  setPayments,
  getPayment,
  addPayment,
  updatePayment,
  deletePayment,
  clearOsteoData,
  getSettings,
  saveSettings,
  exportData,
  importData,
  searchClients,
  getClientsSortedByLastVisit,
}
