'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, Trash2, FileDown, Mic, Square } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  const [audioDialogOpen, setAudioDialogOpen] = useState(false)
  const [isRecordingAudio, setIsRecordingAudio] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioStartRef = useRef<number>(0)

  // Load client data
  useEffect(() => {
    getClient(clientId).then((data) => {
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
    })
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

  // Delete a specific visit
  const handleDeleteVisit = useCallback(async (visitId: string) => {
    if (!client) return
    const updatedVisits = client.visits.filter((v) => v.id !== visitId)
    const updatedClient: Client = { ...client, visits: updatedVisits }
    await saveClient(updatedClient)
    setClient(updatedClient)
    // If current visit was deleted, switch to last remaining or create new
    if (currentVisit?.id === visitId) {
      if (updatedVisits.length > 0) {
        setCurrentVisit(updatedVisits[updatedVisits.length - 1])
      } else {
        setCurrentVisit(createEmptyVisit())
      }
    }
    toast.success('Приём удалён')
  }, [client, currentVisit])

  // Save all changes
  const handleSave = useCallback(async () => {
    if (!client) return

    let updatedVisits = [...client.visits]
    if (currentVisit) {
      const savedAt = new Date().toISOString()
      const visitToSave: Visit = {
        ...currentVisit,
        spineHistory: [
          ...(currentVisit.spineHistory || []),
          {
            id: crypto.randomUUID(),
            date: savedAt,
            spineData: {
              segments: currentVisit.spineData.segments.map((segment) => ({ ...segment })),
              annotations: currentVisit.spineData.annotations.map((annotation) => ({
                ...annotation,
                points: annotation.points?.map((point) => ({ ...point })),
              })),
            },
          },
        ],
      }
      const visitIndex = updatedVisits.findIndex((v) => v.id === currentVisit.id)
      if (visitIndex >= 0) {
        updatedVisits[visitIndex] = visitToSave
      } else {
        updatedVisits.push(visitToSave)
      }
      setCurrentVisit(visitToSave)
    }

    const updatedClient: Client = {
      ...client,
      visits: updatedVisits,
      lastVisit: new Date().toISOString(),
    }

    await saveClient(updatedClient)
    setClient(updatedClient)
    setHasChanges(false)
    toast.success('Изменения сохранены')
  }, [client, currentVisit])

  // Delete client
  const handleDelete = async () => {
    if (!client) return
    await deleteClient(client.id)
    toast.success('Клиент удалён')
    router.push('/clients')
  }

  // Start new visit
  const handleNewVisit = useCallback(async () => {
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

      await saveClient(updatedClient)
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

  const sortedVisits = useMemo(() => {
    return [...visitsWithCurrent].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [visitsWithCurrent])

  const blobToDataUrl = (blob: Blob) => {
    return new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(blob)
    })
  }

  const handleToggleAudioRecording = useCallback(async () => {
    if (isRecordingAudio) {
      mediaRecorderRef.current?.stop()
      return
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      toast.error('Запись аудио не поддерживается в этом браузере')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      audioChunksRef.current = []
      audioStartRef.current = Date.now()

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const type = recorder.mimeType || 'audio/webm'
        const blob = new Blob(audioChunksRef.current, { type })
        const url = await blobToDataUrl(blob)
        const duration = Math.round((Date.now() - audioStartRef.current) / 1000)
        updateClient({
          audioNotes: [
            ...(client?.audioNotes || []),
            {
              id: crypto.randomUUID(),
              url,
              date: new Date().toISOString(),
              type,
              duration,
            },
          ],
        })
        setIsRecordingAudio(false)
        toast.success('Аудиозаметка добавлена')
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecordingAudio(true)
      setAudioDialogOpen(true)
    } catch {
      toast.error('Не удалось получить доступ к микрофону')
    }
  }, [client?.audioNotes, isRecordingAudio, updateClient])

  const handleDeleteAudioNote = useCallback((noteId: string) => {
    if (!client) return
    updateClient({ audioNotes: client.audioNotes.filter((note) => note.id !== noteId) })
  }, [client, updateClient])

  const handleSelectVisit = useCallback((visitId: string) => {
    if (!client) return
    const selectedVisit = visitsWithCurrent.find((visit) => visit.id === visitId)
    if (!selectedVisit) return

    setClient((prev) => {
      if (!prev || !currentVisit) return prev
      const visitIndex = prev.visits.findIndex((visit) => visit.id === currentVisit.id)
      if (visitIndex >= 0) {
        return {
          ...prev,
          visits: prev.visits.map((visit) =>
            visit.id === currentVisit.id ? currentVisit : visit
          ),
        }
      }
      return {
        ...prev,
        visits: [...prev.visits, currentVisit],
      }
    })
    setCurrentVisit(selectedVisit)
    setHasChanges(true)
  }, [client, currentVisit, visitsWithCurrent])

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
          {visitsWithCurrent.length > 0 && currentVisit && (
            <select
              value={currentVisit.id}
              onChange={(event) => handleSelectVisit(event.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {[...visitsWithCurrent]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((visit, index) => (
                  <option key={visit.id} value={visit.id}>
                    {`Приём ${visitsWithCurrent.length - index}: ${new Date(visit.date).toLocaleDateString('ru-RU')}`}
                  </option>
                ))}
            </select>
          )}
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
            onClick={() => setAudioDialogOpen(true)}
          >
            <Mic className="mr-2 h-4 w-4" />
            Аудио {client.audioNotes.length}
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

      <Dialog open={audioDialogOpen} onOpenChange={setAudioDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-hidden sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Аудиозаметки</DialogTitle>
            <DialogDescription>
              Записи сохраняются в карточке клиента после нажатия «Сохранить».
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-hidden">
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-3">
              <div>
                <p className="text-sm font-medium">
                  {isRecordingAudio ? 'Идёт запись...' : 'Новая аудиозаметка'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRecordingAudio ? 'Нажмите «Стоп», чтобы сохранить запись в список.' : 'Нажмите «Записать» и разрешите доступ к микрофону.'}
                </p>
              </div>
              <Button
                variant={isRecordingAudio ? 'destructive' : 'default'}
                onClick={handleToggleAudioRecording}
              >
                {isRecordingAudio ? <Square className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                {isRecordingAudio ? 'Стоп' : 'Записать'}
              </Button>
            </div>

            {client.audioNotes.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">Аудиозаметок пока нет</p>
              </div>
            ) : (
              <div className="max-h-[50vh] space-y-2 overflow-y-auto pr-1">
                {[...client.audioNotes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((note, index) => (
                  <div key={note.id} className="rounded-lg border bg-background p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Аудиозаметка {client.audioNotes.length - index}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(note.date).toLocaleString('ru-RU')}
                          {note.duration ? ` · ${note.duration} сек` : ''}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteAudioNote(note.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <audio controls src={note.url} className="h-9 w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="min-w-0 overflow-x-auto border-b bg-card px-4">
          <TabsList className="h-12 w-max min-w-max justify-start gap-1 bg-transparent p-0">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="h-10 shrink-0 px-3 sm:px-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-auto">
          <TabsContent value="info" className="h-full m-0">
            <TabInfo client={client} currentVisit={currentVisit} allVisits={visitsWithCurrent} onUpdate={updateClient} />
          </TabsContent>

          <TabsContent value="anamnesis" className="h-full m-0">
            <TabAnamnesis client={client} onUpdate={updateClient} />
          </TabsContent>

          <TabsContent value="spine" className="h-full m-0">
            {currentVisit && (
              <TabSpine visit={currentVisit} visits={visitsWithCurrent} onUpdate={updateVisit} onDeleteVisit={handleDeleteVisit} />
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
              <TabGravity visit={currentVisit} allVisits={visitsWithCurrent} onUpdate={updateVisit} />
            )}
          </TabsContent>

          <TabsContent value="body" className="h-full m-0">
            {currentVisit && (
              <TabBodyRegions visit={currentVisit} allVisits={visitsWithCurrent} onUpdate={updateVisit} />
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

        {sortedVisits.length > 0 && currentVisit && (
          <div className="border-t bg-card px-4 py-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {sortedVisits.map((visit, index) => {
                const isActive = visit.id === currentVisit.id
                return (
                  <button
                    key={visit.id}
                    type="button"
                    onClick={() => handleSelectVisit(visit.id)}
                    className={`shrink-0 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      isActive ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
                    }`}
                  >
                    <span className="block font-medium">Приём {sortedVisits.length - index}</span>
                    <span className={isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}>
                      {new Date(visit.date).toLocaleDateString('ru-RU')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
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
