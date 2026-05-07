'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, FileDown } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TabInfo } from '@/components/clients/tabs/tab-info'
import { TabAnamnesis } from '@/components/clients/tabs/tab-anamnesis'
import { TabSpine } from '@/components/clients/tabs/tab-spine'
import { TabNeuroTests } from '@/components/clients/tabs/tab-neuro-tests'
import { TabGravity } from '@/components/clients/tabs/tab-gravity'
import { TabBodyRegions } from '@/components/clients/tabs/tab-body-regions'
import { TabMuscleChains } from '@/components/clients/tabs/tab-muscle-chains'
import { TabVisitInfo } from '@/components/clients/tabs/tab-visit-info'
import { getClient, saveClient, deleteClient } from '@/lib/storage'
import type { Client, Visit } from '@/lib/types'
import { createEmptyVisit } from '@/lib/types'
import { exportClientToPDF } from '@/lib/pdf-export'

const tabs = [
  { value: 'info', label: 'Инфо' },
  { value: 'anamnesis', label: 'Анамнез' },
  { value: 'spine', label: 'Позвоночник' },
  { value: 'neuro', label: 'Тесты' },
  { value: 'gravity', label: 'Центры тяжести' },
  { value: 'body', label: 'Регионы тела' },
  { value: 'muscles', label: 'Цепи мышц' },
  { value: 'visit', label: 'Приём' },
]

export default function ClientCardPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null)
  const [activeTab, setActiveTab] = useState('info')
  const [hasChanges, setHasChanges] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Load client data
  useEffect(() => {
    const data = getClient(clientId)
    if (data) {
      setClient(data)
      // Get the latest visit or create a new one
      if (data.visits.length > 0) {
        setCurrentVisit(data.visits[data.visits.length - 1])
      } else {
        const newVisit = createEmptyVisit()
        setCurrentVisit(newVisit)
      }
    } else {
      router.push('/clients')
    }
  }, [clientId, router])

  // Update client data
  const updateClient = useCallback((updates: Partial<Client>) => {
    setClient((prev) => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
    setHasChanges(true)
  }, [])

  // Update current visit
  const updateVisit = useCallback((updates: Partial<Visit>) => {
    setCurrentVisit((prev) => {
      if (!prev) return null
      return { ...prev, ...updates }
    })
    setHasChanges(true)
  }, [])

  const updateVisitById = useCallback((visitId: string, updates: Partial<Visit>) => {
    setClient((prev) => {
      if (!prev) return null
      return {
        ...prev,
        visits: prev.visits.map((visit) =>
          visit.id === visitId ? { ...visit, ...updates } : visit
        ),
      }
    })
    setCurrentVisit((prev) =>
      prev?.id === visitId ? { ...prev, ...updates } : prev
    )
    setHasChanges(true)
  }, [])

  // Save all changes
  const handleSave = useCallback(() => {
    if (!client) return

    // Update the visit in client's visits array
    let updatedVisits = [...client.visits]
    if (currentVisit) {
      const visitIndex = updatedVisits.findIndex((v) => v.id === currentVisit.id)
      if (visitIndex >= 0) {
        updatedVisits[visitIndex] = currentVisit
      } else {
        updatedVisits.push(currentVisit)
      }
    }

    const updatedClient: Client = {
      ...client,
      visits: updatedVisits,
      lastVisit: new Date().toISOString(),
    }

    saveClient(updatedClient)
    setClient(updatedClient)
    setHasChanges(false)
    toast.success('Изменения сохранены')
  }, [client, currentVisit])

  // Delete client
  const handleDelete = () => {
    if (!client) return
    deleteClient(client.id)
    toast.success('Клиент удалён')
    router.push('/clients')
  }

  // Start new visit
  const handleNewVisit = useCallback(() => {
    // Save current visit first
    if (client && currentVisit) {
      const visitIndex = client.visits.findIndex((v) => v.id === currentVisit.id)
      let updatedVisits = [...client.visits]
      if (visitIndex >= 0) {
        updatedVisits[visitIndex] = currentVisit
      } else {
        updatedVisits.push(currentVisit)
      }

      const newVisit = createEmptyVisit()
      updatedVisits.push(newVisit)

      const updatedClient: Client = {
        ...client,
        visits: updatedVisits,
        lastVisit: new Date().toISOString(),
      }

      saveClient(updatedClient)
      setClient(updatedClient)
      setCurrentVisit(newVisit)
      setHasChanges(false)
      toast.success('Новый приём создан')
    }
  }, [client, currentVisit])

  const visitsWithCurrent = useMemo(() => {
    if (!client) return []
    if (!currentVisit) return client.visits

    const visitIndex = client.visits.findIndex((visit) => visit.id === currentVisit.id)
    if (visitIndex < 0) {
      return [...client.visits, currentVisit]
    }

    return client.visits.map((visit) =>
      visit.id === currentVisit.id ? currentVisit : visit
    )
  }, [client, currentVisit])

  if (!client) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b bg-card px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/clients')}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{client.name}</h1>
            <p className="text-sm text-muted-foreground">
              Визитов: {client.visits.length}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => exportClientToPDF(client)}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            Сохранить
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="border-b bg-card px-4">
          <TabsList className="h-12 w-full justify-start gap-1 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-10 px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="info" className="h-full m-0">
            <TabInfo client={client} onUpdate={updateClient} />
          </TabsContent>

          <TabsContent value="anamnesis" className="h-full m-0">
            <TabAnamnesis client={client} onUpdate={updateClient} />
          </TabsContent>

          <TabsContent value="spine" className="h-full m-0">
            {currentVisit && (
              <TabSpine visit={currentVisit} visits={visitsWithCurrent} onUpdate={updateVisit} />
            )}
          </TabsContent>

          <TabsContent value="neuro" className="h-full m-0">
            {currentVisit && (
              <TabNeuroTests
                visit={currentVisit}
                allVisits={visitsWithCurrent}
                onUpdate={updateVisit}
              />
            )}
          </TabsContent>

          <TabsContent value="gravity" className="h-full m-0">
            {currentVisit && (
              <TabGravity visit={currentVisit} onUpdate={updateVisit} />
            )}
          </TabsContent>

          <TabsContent value="body" className="h-full m-0">
            {currentVisit && (
              <TabBodyRegions visit={currentVisit} onUpdate={updateVisit} />
            )}
          </TabsContent>

          <TabsContent value="muscles" className="h-full m-0">
            {currentVisit && (
              <TabMuscleChains visit={currentVisit} onUpdate={updateVisit} />
            )}
          </TabsContent>

          <TabsContent value="visit" className="h-full m-0">
            {currentVisit && (
              <TabVisitInfo
                visit={currentVisit}
                client={client}
                onUpdate={updateVisit}
                onUpdateVisit={updateVisitById}
                onNewVisit={handleNewVisit}
              />
            )}
          </TabsContent>
        </div>
      </Tabs>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить клиента?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Все данные клиента, включая историю
              визитов и платежей, будут удалены безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
