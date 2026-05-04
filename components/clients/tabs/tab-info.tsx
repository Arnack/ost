'use client'

import { useState, useRef } from 'react'
import { Camera, Upload, X, FileText, Calendar, Mic, MicOff } from 'lucide-react'
import { format, parseISO, differenceInYears } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Client, Photo, ClientFile } from '@/lib/types'
import { isVoiceSupported, startVoiceInput, stopVoiceInput } from '@/lib/voice'

interface TabInfoProps {
  client: Client
  onUpdate: (updates: Partial<Client>) => void
}

export function TabInfo({ client, onUpdate }: TabInfoProps) {
  const photoInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [activeVoiceField, setActiveVoiceField] = useState<'name' | 'phone' | 'email' | null>(null)

  // Calculate age from birth date
  const age = client.birthDate
    ? differenceInYears(new Date(), parseISO(client.birthDate))
    : null

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newPhoto: Photo = {
          id: crypto.randomUUID(),
          url: event.target?.result as string,
          date: new Date().toISOString(),
        }
        onUpdate({ photos: [...client.photos, newPhoto] })
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const newFile: ClientFile = {
          id: crypto.randomUUID(),
          name: file.name,
          url: event.target?.result as string,
          type: file.type,
          date: new Date().toISOString(),
        }
        onUpdate({ files: [...client.files, newFile] })
      }
      reader.readAsDataURL(file)
    })
  }

  // Delete photo
  const handleDeletePhoto = (photoId: string) => {
    onUpdate({ photos: client.photos.filter((p) => p.id !== photoId) })
    setSelectedPhoto(null)
  }

  // Delete file
  const handleDeleteFile = (fileId: string) => {
    onUpdate({ files: client.files.filter((f) => f.id !== fileId) })
  }

  const toggleVoiceInput = (field: 'name' | 'phone' | 'email') => {
    if (activeVoiceField === field) {
      stopVoiceInput()
      setActiveVoiceField(null)
      return
    }

    if (!isVoiceSupported()) {
      toast.error('Голосовой ввод не поддерживается в этом браузере')
      return
    }

    const currentValue = String(client[field] || '')
    startVoiceInput({
      interimResults: false,
      onResult: (text) => {
        const nextValue = currentValue ? `${currentValue} ${text}` : text
        onUpdate({ [field]: nextValue })
      },
      onError: (error) => {
        toast.error(error)
        setActiveVoiceField(null)
      },
      onStart: () => setActiveVoiceField(field),
      onEnd: () => setActiveVoiceField(null),
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
                <div className="flex gap-2">
                  <Input
                    value={client.name}
                    onChange={(e) => onUpdate({ name: e.target.value })}
                    className="h-11"
                  />
                  <Button
                    type="button"
                    variant={activeVoiceField === 'name' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleVoiceInput('name')}
                  >
                    {activeVoiceField === 'name' ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Field>
              <Field>
                <FieldLabel>Дата рождения</FieldLabel>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={client.birthDate?.split('T')[0] || ''}
                    onChange={(e) =>
                      onUpdate({ birthDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })
                    }
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
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    value={client.phone || ''}
                    onChange={(e) => onUpdate({ phone: e.target.value })}
                    placeholder="+7 (___) ___-__-__"
                    className="h-11"
                  />
                  <Button
                    type="button"
                    variant={activeVoiceField === 'phone' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleVoiceInput('phone')}
                  >
                    {activeVoiceField === 'phone' ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Field>
              <Field>
                <FieldLabel>Email</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={client.email || ''}
                    onChange={(e) => onUpdate({ email: e.target.value })}
                    placeholder="email@example.com"
                    className="h-11"
                  />
                  <Button
                    type="button"
                    variant={activeVoiceField === 'email' ? 'default' : 'outline'}
                    size="icon"
                    onClick={() => toggleVoiceInput('email')}
                  >
                    {activeVoiceField === 'email' ? (
                      <MicOff className="h-4 w-4" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Photo Gallery */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Фотографии</CardTitle>
            <Button
              variant="outline"
              onClick={() => photoInputRef.current?.click()}
            >
              <Camera className="mr-2 h-4 w-4" />
              Добавить фото
            </Button>
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
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {client.photos.map((photo) => (
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
            )}
          </CardContent>
        </Card>

        {/* Files */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Файлы</CardTitle>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              Загрузить файл
            </Button>
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
              <div className="space-y-2">
                {client.files.map((file) => (
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
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                      >
                        <a href={file.url} download={file.name}>
                          <Upload className="h-4 w-4 rotate-180" />
                        </a>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Visit History */}
        <Card>
          <CardHeader>
            <CardTitle>История визитов</CardTitle>
          </CardHeader>
          <CardContent>
            {client.visits.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Нет записей о визитах
              </p>
            ) : (
              <div className="space-y-2">
                {[...client.visits].reverse().slice(0, 10).map((visit, index) => (
                  <div
                    key={visit.id}
                    className="flex items-center gap-3 p-3 rounded-lg border"
                  >
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">
                        Визит #{client.visits.length - index}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(visit.date), 'd MMMM yyyy, HH:mm', {
                          locale: ru,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
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
