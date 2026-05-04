'use client'

import { useState, useEffect } from 'react'
import { Save, Key, Download, Upload, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
  clearOsteoData,
  exportData,
  getAppointments,
  getClients,
  getPayments,
  getSettings,
  importData,
  saveSettings,
} from '@/lib/storage'
import type { Settings } from '@/lib/types'

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    defaultSessionDuration: 60,
    defaultSessionCost: 5000,
  })
  const [hasChanges, setHasChanges] = useState(false)
  const [dataCounts, setDataCounts] = useState({
    clients: 0,
    visits: 0,
    appointments: 0,
    payments: 0,
  })

  const refreshDataCounts = () => {
    const clients = getClients()
    setDataCounts({
      clients: clients.length,
      visits: clients.reduce((acc, client) => acc + client.visits.length, 0),
      appointments: getAppointments().length,
      payments: getPayments().length,
    })
  }

  useEffect(() => {
    setSettings(getSettings())
    refreshDataCounts()
  }, [])

  const handleSave = () => {
    saveSettings(settings)
    setHasChanges(false)
    toast.success('Настройки сохранены')
  }

  const handleExport = () => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `osteotab-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('Данные экспортированы')
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (importData(content)) {
        toast.success('Данные импортированы')
        setSettings(getSettings())
        refreshDataCounts()
      } else {
        toast.error('Ошибка импорта данных')
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const handleClearData = () => {
    clearOsteoData()
    toast.success('Все данные удалены')
    setSettings(getSettings())
    refreshDataCounts()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Настройки</h1>
        <p className="text-sm text-muted-foreground">
          Управление приложением и данными
        </p>
      </div>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Интеграция с AI
          </CardTitle>
          <CardDescription>
            Настройте API ключ Claude для AI-анализа визитов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>API ключ Claude (Anthropic)</FieldLabel>
              <Input
                type="password"
                value={settings.claudeApiKey || ''}
                onChange={(e) => {
                  setSettings({ ...settings, claudeApiKey: e.target.value })
                  setHasChanges(true)
                }}
                placeholder="sk-ant-..."
                className="h-11 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Получите ключ на{' '}
                <a
                  href="https://console.anthropic.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  console.anthropic.com
                </a>
              </p>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Default values */}
      <Card>
        <CardHeader>
          <CardTitle>Настройки по умолчанию</CardTitle>
          <CardDescription>
            Значения для новых записей
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>Длительность сеанса (мин)</FieldLabel>
              <Input
                type="number"
                value={settings.defaultSessionDuration}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    defaultSessionDuration: Number(e.target.value),
                  })
                  setHasChanges(true)
                }}
                min={15}
                max={180}
                step={15}
                className="h-11"
              />
            </Field>
            <Field>
              <FieldLabel>Стоимость сеанса (руб)</FieldLabel>
              <Input
                type="number"
                value={settings.defaultSessionCost}
                onChange={(e) => {
                  setSettings({
                    ...settings,
                    defaultSessionCost: Number(e.target.value),
                  })
                  setHasChanges(true)
                }}
                min={0}
                step={500}
                className="h-11"
              />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      {/* Data management */}
      <Card>
        <CardHeader>
          <CardTitle>Управление данными</CardTitle>
          <CardDescription>
            Экспорт, импорт и очистка данных
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{dataCounts.clients}</p>
              <p className="text-xs text-muted-foreground">Клиентов</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {dataCounts.visits}
              </p>
              <p className="text-xs text-muted-foreground">Визитов</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{dataCounts.appointments}</p>
              <p className="text-xs text-muted-foreground">Записей</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">{dataCounts.payments}</p>
              <p className="text-xs text-muted-foreground">Оплат</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Экспорт данных
            </Button>

            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="mr-2 h-4 w-4" />
                Импорт данных
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImport}
                />
              </label>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Очистить все данные
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Очистить все данные?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Все клиенты, визиты, записи и
                    настройки будут удалены безвозвратно.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearData}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Удалить всё
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={!hasChanges} size="lg">
          <Save className="mr-2 h-5 w-5" />
          Сохранить настройки
        </Button>
      </div>
    </div>
  )
}
