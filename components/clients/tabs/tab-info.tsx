'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, FileText } from 'lucide-react'
import { format, parseISO, differenceInYears } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VoiceMicButton } from '@/components/ui/voice-mic-button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import type { Client, Photo, ClientFile, Visit } from '@/lib/types'
import { isVoiceSupported, startVoiceInput, stopVoiceInput } from '@/lib/voice'

interface TabInfoProps {
  client: Client
  currentVisit: Visit | null
  allVisits: Visit[]
  onUpdate: (updates: Partial<Client>) => void
}

export function TabInfo({ client, currentVisit, allVisits, onUpdate }: TabInfoProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [activeVoiceField, setActiveVoiceField] = useState<'name' | 'phone' | 'email' | null>(null)
  const [interimText, setInterimText] = useState('')
  const [birthDateInput, setBirthDateInput] = useState('')
  const [expandedVisits, setExpandedVisits] = useState<Set<string>>(new Set())

  const age = client.birthDate
    ? differenceInYears(new Date(), parseISO(client.birthDate))
    : null

  const formatBirthDateInput = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8)
    if (digits.length <= 2) return digits
    if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
  }

  const birthDateValue = client.birthDate
    ? format(parseISO(client.birthDate), 'dd.MM.yyyy')
    : ''

  useEffect(() => {
    setBirthDateInput(birthDateValue)
  }, [birthDateValue])

  const handleBirthDateChange = (value: string) => {
    const formatted = formatBirthDateInput(value)
    setBirthDateInput(formatted)
    const digits = formatted.replace(/\D/g, '')

    if (digits.length === 0) {
      onUpdate({ birthDate: undefined })
      return
    }

    if (digits.length !== 8) return

    const day = Number(digits.slice(0, 2))
    const month = Number(digits.slice(2, 4))
    const year = Number(digits.slice(4, 8))
    const date = new Date(year, month - 1, day)
    const isValid =
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day

    onUpdate({ birthDate: isValid ? date.toISOString() : undefined })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const selectedFiles = Array.from(files)
    Promise.all(selectedFiles.map((file) => new Promise<Photo>((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        resolve({
          id: crypto.randomUUID(),
          url: event.target?.result as string,
          date: new Date().toISOString(),
          visitId: currentVisit?.id,
        })
      }
      reader.readAsDataURL(file)
    }))).then((newPhotos) => {
      onUpdate({ photos: [...client.photos, ...newPhotos] })
    })
    e.target.value = ''
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    const selectedFiles = Array.from(files)
    Promise.all(selectedFiles.map((file) => new Promise<ClientFile>((resolve) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        resolve({
          id: crypto.randomUUID(),
          name: file.name,
          url: event.target?.result as string,
          type: file.type,
          date: new Date().toISOString(),
          visitId: currentVisit?.id,
        })
      }
      reader.readAsDataURL(file)
    }))).then((newFiles) => {
      onUpdate({ files: [...client.files, ...newFiles] })
    })
    e.target.value = ''
  }

  const handleDeletePhoto = (photoId: string) => {
    onUpdate({ photos: client.photos.filter((p) => p.id !== photoId) })
    setSelectedPhoto(null)
  }

  const handleDeleteFile = (fileId: string) => {
    onUpdate({ files: client.files.filter((f) => f.id !== fileId) })
  }

  const toggleVoiceInput = (field: 'name' | 'phone' | 'email') => {
    if (activeVoiceField === field) {
      stopVoiceInput()
      setActiveVoiceField(null)
      setInterimText('')
      return
    }

    if (!isVoiceSupported()) {
      toast.error('Голосовой ввод не поддерживается в этом браузере')
      return
    }

    const currentValue = String(client[field] || '')
    startVoiceInput({
      interimResults: true,
      continuous: true,
      restartOnEnd: true,
      onResult: (text) => {
        const nextValue = currentValue ? `${currentValue} ${text}` : text
        onUpdate({ [field]: nextValue })
        setInterimText('')
      },
      onError: (error) => {
        toast.error(error)
        setActiveVoiceField(null)
        setInterimText('')
      },
      onStart: () => {
        setActiveVoiceField(field)
        setInterimText('')
      },
      onEnd: () => {
        setActiveVoiceField(null)
        setInterimText('')
      },
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="grid grid-cols-2 gap-4">
              <Field className="col-span-2 md:col-span-1">
                <FieldLabel>ФИО</FieldLabel>
                <div className="flex gap-2 items-center">
                  <Input
                    value={client.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="h-11"
                  />
                  <VoiceMicButton
                    active={activeVoiceField === 'name'}
                    interimText={activeVoiceField === 'name' ? interimText : undefined}
                    onClick={() => toggleVoiceInput('name')}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel>Дата рождения</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    inputMode="numeric"
                    value={birthDateInput}
                    onChange={(e) => handleBirthDateChange(e.target.value)}
                    placeholder="ДД.ММ.ГГГГ"
                    className="h-11"
                  />
                  {age !== null && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      {age} лет
                    </span>
                  )}
                </div>
              </Field>
              <Field>
                <FieldLabel>Телефон</FieldLabel>
                <div className="flex gap-2 items-center">
                  <Input
                    type="tel"
                    value={client.phone || ''}
                    onChange={(e) => onUpdate({ phone: e.target.value })}
                    placeholder="+7 (___) ___-__-__"
                    className="h-11"
                  />
                  <VoiceMicButton
                    active={activeVoiceField === 'phone'}
                    interimText={activeVoiceField === 'phone' ? interimText : undefined}
                    onClick={() => toggleVoiceInput('phone')}
                  />
                </div>
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <div className="flex gap-2 items-center">
                  <Input
                    type="email"
                    value={client.email || ''}
                    onChange={(e) => onUpdate({ email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-11"
                  />
                  <VoiceMicButton
                    active={activeVoiceField === 'email'}
                    interimText={activeVoiceField === 'email' ? interimText : undefined}
                    onClick={() => toggleVoiceInput('email')}
                  />
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Фотографии</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => photoInputRef.current?.click()}>
                <Camera className="mr-2 h-4 w-4" />
                Добавить фото
                {currentVisit && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (к приёму #{allVisits.findIndex(v => v.id === currentVisit.id) + 1})
                  </span>
                )}
              </Button>
            </div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handlePhotoUpload}
            />
          </CardHeader>
          <CardContent>
            {client.photos.length === 0 ? (
              <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
                <div className="text-center">
                  <Camera className="mx-auto h-10 w-10 mb-2" />
                  <p>Нет фотографий</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const photosByVisit = new Map<string | undefined, Photo[]>()
                  client.photos.forEach(photo => {
                    const visitId = photo.visitId
                    if (!photosByVisit.has(visitId)) {
                      photosByVisit.set(visitId, [])
                    }
                    photosByVisit.get(visitId)!.push(photo)
                  })

                  const sortedVisitIds = Array.from(photosByVisit.keys()).sort((a, b) => {
                    if (!a) return 1
                    if (!b) return -1
                    const visitA = allVisits.find(v => v.id === a)
                    const visitB = allVisits.find(v => v.id === b)
                    if (!visitA) return 1
                    if (!visitB) return -1
                    return new Date(visitB.date).getTime() - new Date(visitA.date).getTime()
                  })

                  return sortedVisitIds.map(visitId => {
                    const photos = photosByVisit.get(visitId)!
                    const visit = visitId ? allVisits.find(v => v.id === visitId) : null
                    const visitIndex = visit ? allVisits.indexOf(visit) : -1
                    const isExpanded = expandedVisits.has(visitId || 'none')

                    return (
                      <Collapsible
                        key={visitId || 'none'}
                        open={isExpanded}
                        onOpenChange={(open) => {
                          const newExpanded = new Set(expandedVisits)
                          if (open) {
                            newExpanded.add(visitId || 'none')
                          } else {
                            newExpanded.delete(visitId || 'none')
                          }
                          setExpandedVisits(newExpanded)
                        }}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50">
                            <span className="font-medium text-sm">
                              {visit ? `Приём #${allVisits.length + 1 - (allVisits.length - visitIndex)} - ${format(parseISO(visit.date), 'd MMM yyyy', { locale: ru })}` : 'Без привязки'}
                              <span className="ml-2 text-muted-foreground">({photos.length})</span>
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {photos.map((photo) => (
                              <div
                                key={photo.id}
                                className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer border"
                                onClick={() => setSelectedPhoto(photo)}
                              >
                                <img
                                  src={photo.url}
                                  alt={photo.description || 'Фото клиента'}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeletePhoto(photo.id)
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                                  {format(parseISO(photo.date), 'd MMM yy', { locale: ru })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })
                })()}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Файлы</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Загрузить файл
                {currentVisit && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (к приёму #{allVisits.findIndex(v => v.id === currentVisit.id) + 1})
                  </span>
                )}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </CardHeader>
          <CardContent>
            {client.files.length === 0 ? (
              <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground">
                <div className="text-center">
                  <FileText className="mx-auto h-8 w-8 mb-1" />
                  <p className="text-sm">Нет файлов</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const filesByVisit = new Map<string | undefined, ClientFile[]>()
                  client.files.forEach(file => {
                    const visitId = file.visitId
                    if (!filesByVisit.has(visitId)) {
                      filesByVisit.set(visitId, [])
                    }
                    filesByVisit.get(visitId)!.push(file)
                  })

                  const sortedVisitIds = Array.from(filesByVisit.keys()).sort((a, b) => {
                    if (!a) return 1
                    if (!b) return -1
                    const visitA = allVisits.find(v => v.id === a)
                    const visitB = allVisits.find(v => v.id === b)
                    if (!visitA) return 1
                    if (!visitB) return -1
                    return new Date(visitB.date).getTime() - new Date(visitA.date).getTime()
                  })

                  return sortedVisitIds.map(visitId => {
                    const files = filesByVisit.get(visitId)!
                    const visit = visitId ? allVisits.find(v => v.id === visitId) : null
                    const visitIndex = visit ? allVisits.indexOf(visit) : -1
                    const isExpanded = expandedVisits.has(visitId || 'none')

                    return (
                      <Collapsible
                        key={visitId || 'none'}
                        open={isExpanded}
                        onOpenChange={(open) => {
                          const newExpanded = new Set(expandedVisits)
                          if (open) {
                            newExpanded.add(visitId || 'none')
                          } else {
                            newExpanded.delete(visitId || 'none')
                          }
                          setExpandedVisits(newExpanded)
                        }}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 cursor-pointer hover:bg-muted/50">
                            <span className="font-medium text-sm">
                              {visit ? `Приём #${allVisits.length - visitIndex} - ${format(parseISO(visit.date), 'd MMM yyyy', { locale: ru })}` : 'Без привязки'}
                              <span className="ml-2 text-muted-foreground">({files.length})</span>
                            </span>
                            <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                          <div className="space-y-2">
                            {files.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                              >
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                  <div>
                                    <p className="font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {format(parseISO(file.date), 'd MMM yyyy', { locale: ru })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button variant="ghost" size="icon" asChild>
                                    <a href={file.url} download={file.name}>
                                      <Upload className="h-4 w-4 rotate-180" />
                                    </a>
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    )
                  })
                })()}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* Photo preview modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.description || 'Фото клиента'}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={(e) => {
                e.stopPropagation()
                handleDeletePhoto(selectedPhoto.id)
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </ScrollArea>
  )
}
