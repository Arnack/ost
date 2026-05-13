import type { Client, Appointment, Settings, Payment } from './types'
import { normalizeClient, normalizePayment } from './types'

const DB_NAME = 'osteotab_db'
const DB_VERSION = 1

const STORE_NAMES = {
  CLIENTS: 'clients',
  APPOINTMENTS: 'appointments',
  PAYMENTS: 'payments',
  SETTINGS: 'settings',
} as const

type StoreName = typeof STORE_NAMES[keyof typeof STORE_NAMES]

const defaultSettings: Settings = {
  gigaChatModel: 'GigaChat',
  defaultSessionDuration: 60,
  defaultSessionCost: 5000,
}

export const STORAGE_CHANGED_EVENT = 'osteotab-storage-changed'

function notifyStorageChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(STORAGE_CHANGED_EVENT))
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not available'))
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      Object.values(STORE_NAMES).forEach((storeName) => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      })
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function runStore<T>(storeName: StoreName, mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDatabase().then((db) => new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(storeName, mode)
    const store = transaction.objectStore(storeName)
    const request = action(store)

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => db.close()
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  }))
}

async function getAll<T>(storeName: StoreName): Promise<T[]> {
  try {
    return await runStore<T[]>(storeName, 'readonly', (store) => store.getAll() as IDBRequest<T[]>)
  } catch (error) {
    console.error('[v0] Error reading IndexedDB:', error)
    return []
  }
}

async function putItem<T extends { id: string }>(storeName: StoreName, value: T): Promise<void> {
  try {
    await runStore<IDBValidKey>(storeName, 'readwrite', (store) => store.put(value))
  } catch (error) {
    console.error('[v0] Error saving to IndexedDB:', error)
  }
}

async function deleteItem(storeName: StoreName, id: string): Promise<void> {
  try {
    await runStore<undefined>(storeName, 'readwrite', (store) => store.delete(id))
  } catch (error) {
    console.error('[v0] Error deleting from IndexedDB:', error)
  }
}

async function clearStore(storeName: StoreName): Promise<void> {
  try {
    await runStore<undefined>(storeName, 'readwrite', (store) => store.clear())
  } catch (error) {
    console.error('[v0] Error clearing IndexedDB:', error)
  }
}

export async function getClients(): Promise<Client[]> {
  return (await getAll<Client>(STORE_NAMES.CLIENTS)).map(normalizeClient)
}

export async function setClients(clients: Client[]): Promise<void> {
  await clearStore(STORE_NAMES.CLIENTS)
  await Promise.all(clients.map((client) => putItem(STORE_NAMES.CLIENTS, normalizeClient(client))))
  notifyStorageChanged()
}

export async function getClient(id: string): Promise<Client | undefined> {
  try {
    const client = await runStore<Client | undefined>(STORE_NAMES.CLIENTS, 'readonly', (store) => store.get(id))
    return client ? normalizeClient(client) : undefined
  } catch {
    return undefined
  }
}

export async function saveClient(client: Client): Promise<void> {
  await putItem(STORE_NAMES.CLIENTS, normalizeClient(client))
  notifyStorageChanged()
}

export async function deleteClient(id: string): Promise<void> {
  await deleteItem(STORE_NAMES.CLIENTS, id)
  notifyStorageChanged()
}

export async function getAppointments(): Promise<Appointment[]> {
  return getAll<Appointment>(STORE_NAMES.APPOINTMENTS)
}

export async function setAppointments(appointments: Appointment[]): Promise<void> {
  await clearStore(STORE_NAMES.APPOINTMENTS)
  await Promise.all(appointments.map((appointment) => putItem(STORE_NAMES.APPOINTMENTS, appointment)))
  notifyStorageChanged()
}

export async function getAppointment(id: string): Promise<Appointment | undefined> {
  try {
    return await runStore<Appointment | undefined>(STORE_NAMES.APPOINTMENTS, 'readonly', (store) => store.get(id))
  } catch {
    return undefined
  }
}

export async function saveAppointment(appointment: Appointment): Promise<void> {
  await putItem(STORE_NAMES.APPOINTMENTS, appointment)
  notifyStorageChanged()
}

export async function deleteAppointment(id: string): Promise<void> {
  await deleteItem(STORE_NAMES.APPOINTMENTS, id)
  notifyStorageChanged()
}

export async function getAppointmentsForDate(date: string): Promise<Appointment[]> {
  const appointments = await getAppointments()
  return appointments.filter((appointment) => appointment.date.startsWith(date))
}

export async function getTodayAppointments(): Promise<Appointment[]> {
  const today = new Date().toISOString().split('T')[0]
  return getAppointmentsForDate(today)
}

export async function getPayments(): Promise<Payment[]> {
  return (await getAll<Payment>(STORE_NAMES.PAYMENTS)).map(normalizePayment)
}

export async function setPayments(payments: Payment[]): Promise<void> {
  await clearStore(STORE_NAMES.PAYMENTS)
  await Promise.all(payments.map((payment) => putItem(STORE_NAMES.PAYMENTS, normalizePayment(payment))))
  notifyStorageChanged()
}

export async function getPayment(id: string): Promise<Payment | undefined> {
  try {
    const payment = await runStore<Payment | undefined>(STORE_NAMES.PAYMENTS, 'readonly', (store) => store.get(id))
    return payment ? normalizePayment(payment) : undefined
  } catch {
    return undefined
  }
}

export async function addPayment(payment: Payment): Promise<void> {
  await putItem(STORE_NAMES.PAYMENTS, normalizePayment(payment))
  notifyStorageChanged()
}

export async function updatePayment(payment: Payment): Promise<void> {
  await putItem(STORE_NAMES.PAYMENTS, normalizePayment(payment))
  notifyStorageChanged()
}

export async function deletePayment(id: string): Promise<void> {
  await deleteItem(STORE_NAMES.PAYMENTS, id)
  notifyStorageChanged()
}

export async function clearOsteoData(): Promise<void> {
  await Promise.all([
    clearStore(STORE_NAMES.CLIENTS),
    clearStore(STORE_NAMES.APPOINTMENTS),
    clearStore(STORE_NAMES.PAYMENTS),
  ])
  await saveSettings(defaultSettings)
  notifyStorageChanged()
}

export async function getSettings(): Promise<Settings> {
  try {
    const stored = await runStore<(Settings & { id: string }) | undefined>(STORE_NAMES.SETTINGS, 'readonly', (store) => store.get('settings'))
    if (!stored) return defaultSettings
    const { id: _, ...settings } = stored
    return { ...defaultSettings, ...settings }
  } catch {
    return defaultSettings
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await putItem(STORE_NAMES.SETTINGS, { id: 'settings', ...settings })
  notifyStorageChanged()
}

export async function searchClients(query: string): Promise<Client[]> {
  const clients = await getClients()
  const q = query.toLowerCase().trim()
  if (!q) return clients
  return clients.filter(
    (client) =>
      client.name.toLowerCase().includes(q) ||
      client.phone?.toLowerCase().includes(q) ||
      client.email?.toLowerCase().includes(q)
  )
}

export async function getClientsSortedByLastVisit(): Promise<Client[]> {
  const clients = await getClients()
  return [...clients].sort(
    (a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime()
  )
}

export async function exportData(): Promise<string> {
  const [clients, appointments, payments, settings] = await Promise.all([
    getClients(),
    getAppointments(),
    getPayments(),
    getSettings(),
  ])

  return JSON.stringify({
    clients,
    appointments,
    payments,
    settings,
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

export async function importData(jsonString: string): Promise<boolean> {
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

    await setClients(Array.isArray(clients) ? clients.map((client) => normalizeClient(client as Client)) : [])
    await setAppointments(Array.isArray(appointments) ? appointments as Appointment[] : [])
    await setPayments(Array.isArray(payments) ? payments.map((payment) => normalizePayment(payment as Payment)) : [])
    await saveSettings(isSettings(settings) ? settings : defaultSettings)

    return true
  } catch {
    return false
  }
}

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
