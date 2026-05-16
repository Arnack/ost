'use client'

import { useState } from 'react'
import { toast } from 'sonner'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { ScrollArea } from '@/components/ui/scroll-area'
import { VoiceMicButton } from '@/components/ui/voice-mic-button'
import type { Client, Anamnesis } from '@/lib/types'
import { isVoiceSupported, startVoiceInput, stopVoiceInput } from '@/lib/voice'

interface TabAnamnesisProps {
  client: Client
  onUpdate: (updates: Partial<Client>) => void
}

const anamnesisFields = [
  { key: 'symptoms',        label: 'Симптомы' },
  { key: 'firstSymptoms',   label: 'Первые симптомы (когда, как началось)' },
  { key: 'complaints',      label: 'Жалобы' },
  { key: 'injuries',        label: 'Травмы' },
  { key: 'scars',           label: 'Рубцы / шрамы' },
  { key: 'medications',     label: 'Принимаемые препараты' },
  { key: 'birthTraumas',    label: 'Родовые травмы' },
  { key: 'sleepPositions',  label: 'Позы сна' },
  { key: 'specialists',     label: 'Обращения к специалистам' },
  { key: 'treatment',       label: 'Проведённое лечение' },
  { key: 'treatmentResult', label: 'Результат лечения' },
  { key: 'diagnosis',       label: 'Диагноз' },
  { key: 'additionalInfo',  label: 'Дополнительная информация' },
  { key: 'desiredResult',   label: 'Желаемый результат' },
] as const

export function TabAnamnesis({ client, onUpdate }: TabAnamnesisProps) {
  const [activeVoiceField, setActiveVoiceField] = useState<keyof Anamnesis | null>(null)
  const [interimText, setInterimText] = useState('')

  const updateAnamnesis = (key: keyof Anamnesis, value: string | number) => {
    onUpdate({
      anamnesis: {
        ...client.anamnesis,
        [key]: value,
      },
    })
  }

  const toggleVoiceInput = (key: keyof Anamnesis) => {
    if (activeVoiceField === key) {
      stopVoiceInput()
      setActiveVoiceField(null)
      setInterimText('')
      return
    }

    if (!isVoiceSupported()) {
      toast.error('Голосовой ввод не поддерживается в этом браузере')
      return
    }

    const currentValue = String(client.anamnesis[key] || '')
    startVoiceInput({
      interimResults: true,
      continuous: true,
      restartOnEnd: true,
      onResult: (text) => {
        const nextValue = currentValue ? `${currentValue} ${text}` : text
        updateAnamnesis(key, nextValue)
        setInterimText('')
      },
      onError: (error) => {
        toast.error(error)
        setActiveVoiceField(null)
        setInterimText('')
      },
      onStart: () => {
        setActiveVoiceField(key)
        setInterimText('')
      },
      onEnd: () => {
        if (activeVoiceField === key) return
        setActiveVoiceField(null)
      },
    })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Text fields */}
        <Card>
          <CardHeader>
            <CardTitle>История болезни</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="space-y-4">
              {anamnesisFields.map((field) => (
                <Field key={field.key}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <FieldLabel className="mb-0">{field.label}</FieldLabel>
                    <VoiceMicButton
                      active={activeVoiceField === field.key}
                      interimText={activeVoiceField === field.key ? interimText : undefined}
                      size="sm"
                      onClick={() => toggleVoiceInput(field.key)}
                    />
                  </div>
                  <Textarea
                    value={client.anamnesis[field.key] as string}
                    onChange={(e) => updateAnamnesis(field.key, e.target.value)}
                    placeholder={`Введите ${field.label.toLowerCase()}...`}
                    className="min-h-[80px] resize-none"
                  />
                </Field>
              ))}
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Readiness sliders */}
        <Card>
          <CardHeader>
            <CardTitle>Готовность к изменениям</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="space-y-8">
              <Field>
                <div className="flex items-center justify-between mb-3">
                  <FieldLabel>Готовность тела</FieldLabel>
                  <span className="text-2xl font-semibold text-primary">
                    {client.anamnesis.bodyReadiness}
                  </span>
                </div>
                <Slider
                  value={[client.anamnesis.bodyReadiness]}
                  onValueChange={([value]) => updateAnamnesis('bodyReadiness', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 - Низкая</span>
                  <span>10 - Высокая</span>
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between mb-3">
                  <FieldLabel>Готовность ума</FieldLabel>
                  <span className="text-2xl font-semibold text-primary">
                    {client.anamnesis.mindReadiness}
                  </span>
                </div>
                <Slider
                  value={[client.anamnesis.mindReadiness]}
                  onValueChange={([value]) => updateAnamnesis('mindReadiness', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 - Низкая</span>
                  <span>10 - Высокая</span>
                </div>
              </Field>

              <Field>
                <div className="flex items-center justify-between mb-3">
                  <FieldLabel>Готовность сознания</FieldLabel>
                  <span className="text-2xl font-semibold text-primary">
                    {client.anamnesis.consciousnessReadiness}
                  </span>
                </div>
                <Slider
                  value={[client.anamnesis.consciousnessReadiness]}
                  onValueChange={([value]) => updateAnamnesis('consciousnessReadiness', value)}
                  min={1}
                  max={10}
                  step={1}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 - Низкая</span>
                  <span>10 - Высокая</span>
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
