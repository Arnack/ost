'use client'

import { useState, useRef, useEffect } from 'react'
import { Plus, Sparkles, Mic, MicOff } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { Separator } from '@/components/ui/separator'
import { isVoiceSupported, startVoiceInput, stopVoiceInput } from '@/lib/voice'
import { analyzeVisit } from '@/lib/claude'
import type { Visit, Client } from '@/lib/types'

interface TabVisitInfoProps {
  visit: Visit
  client: Client
  onUpdate: (updates: Partial<Visit>) => void
  onUpdateVisit: (visitId: string, updates: Partial<Visit>) => void
  onNewVisit: () => void
}

export function TabVisitInfo({ visit, client, onUpdate, onUpdateVisit, onNewVisit }: TabVisitInfoProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const [activeField, setActiveField] = useState<'notes' | 'plan'>('notes')
  const notesRef = useRef<HTMLTextAreaElement>(null)
  const planRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setVoiceSupported(isVoiceSupported())
  }, [])

  // Voice recording
  const toggleRecording = (field: 'notes' | 'plan') => {
    if (isRecording) {
      stopVoiceInput()
      setIsRecording(false)
      toast.success('Запись остановлена')
    } else {
      setActiveField(field)
      startVoiceInput({
        onResult: (text) => {
          if (field === 'notes') {
            const currentNotes = visit.notes || ''
            onUpdate({ notes: currentNotes + (currentNotes ? ' ' : '') + text })
          } else {
            const currentPlan = visit.nextPlan || ''
            onUpdate({ nextPlan: currentPlan + (currentPlan ? ' ' : '') + text })
          }
        },
        onError: (error) => {
          toast.error(error)
          setIsRecording(false)
        },
        onStart: () => {
          setIsRecording(true)
          toast.info('Говорите...')
        },
        onEnd: () => {
          setIsRecording(false)
        },
        continuous: true,
        interimResults: false,
      })
    }
  }

  // AI Analysis
  const handleAnalyzeVisit = async () => {
    setIsAnalyzing(true)
    try {
      const analysis = await analyzeVisit(visit, client)
      onUpdate({ aiSummary: analysis })
    } catch (error) {
      toast.error('Ошибка анализа')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Visit header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Информация о приёме</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {format(parseISO(visit.date), "d MMMM yyyy, HH:mm", { locale: ru })}
              </p>
            </div>
            <Button onClick={onNewVisit}>
              <Plus className="mr-2 h-4 w-4" />
              Новый приём
            </Button>
          </CardHeader>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Заметки по приёму</CardTitle>
            {voiceSupported && (
              <Button
                variant={isRecording && activeField === 'notes' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => toggleRecording('notes')}
              >
                {isRecording && activeField === 'notes' ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4 animate-pulse" />
                    Остановить
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Голосовой ввод
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <FieldGroup className="space-y-4">
              <Field>
                <FieldLabel>Что обсуждали / чем работали</FieldLabel>
                <Textarea
                  ref={notesRef}
                  value={visit.notes}
                  onChange={(e) => onUpdate({ notes: e.target.value })}
                  placeholder="Опишите, что обсуждали и чем работали на приёме..."
                  className="min-h-[150px]"
                />
              </Field>
              <Field>
                <div className="flex items-center justify-between mb-2">
                  <FieldLabel>Договорились на следующий раз</FieldLabel>
                  {voiceSupported && (
                    <Button
                      variant={isRecording && activeField === 'plan' ? 'destructive' : 'ghost'}
                      size="sm"
                      onClick={() => toggleRecording('plan')}
                      className="h-7 text-xs"
                    >
                      {isRecording && activeField === 'plan' ? (
                        <>
                          <MicOff className="mr-1 h-3 w-3 animate-pulse" />
                          Стоп
                        </>
                      ) : (
                        <>
                          <Mic className="mr-1 h-3 w-3" />
                          Диктовать
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <Textarea
                  ref={planRef}
                  value={visit.nextPlan}
                  onChange={(e) => onUpdate({ nextPlan: e.target.value })}
                  placeholder="Что договорились сделать или обсудить на следующем приёме..."
                  className="min-h-[100px]"
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Анализ
            </CardTitle>
            <Button
              variant="outline"
              onClick={handleAnalyzeVisit}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? 'Анализирую...' : 'Проанализировать'}
            </Button>
          </CardHeader>
          <CardContent>
            {visit.aiSummary ? (
              <div className="prose prose-sm max-w-none">
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg whitespace-pre-wrap">
                  {visit.aiSummary}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                Нажмите «Проанализировать» для AI-анализа данных визита
              </p>
            )}
          </CardContent>
        </Card>

        <Separator />

        <Card>
          <CardHeader>
            <CardTitle>Редактируемая история визитов</CardTitle>
          </CardHeader>
          <CardContent>
            {client.visits.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Нет сохранённых визитов</p>
            ) : (
              <div className="space-y-3">
                {[...client.visits]
                  .reverse()
                  .map((v, index) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-lg border bg-muted/20"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">
                          Визит #{client.visits.length - index - 1}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(v.date), 'd MMM yyyy', { locale: ru })}
                        </span>
                      </div>
                      <FieldGroup className="space-y-3">
                        <Field>
                          <FieldLabel>Что обсуждали / чем работали</FieldLabel>
                          <Textarea
                            value={v.id === visit.id ? visit.notes : v.notes}
                            onChange={(e) =>
                              v.id === visit.id
                                ? onUpdate({ notes: e.target.value })
                                : onUpdateVisit(v.id, { notes: e.target.value })
                            }
                            className="min-h-[80px]"
                          />
                        </Field>
                        <Field>
                          <FieldLabel>Договорились на следующий раз</FieldLabel>
                          <Textarea
                            value={v.id === visit.id ? visit.nextPlan : v.nextPlan}
                            onChange={(e) =>
                              v.id === visit.id
                                ? onUpdate({ nextPlan: e.target.value })
                                : onUpdateVisit(v.id, { nextPlan: e.target.value })
                            }
                            className="min-h-[70px]"
                          />
                        </Field>
                      </FieldGroup>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick summary of current visit */}
        <Card>
          <CardHeader>
            <CardTitle>Сводка текущего визита</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-primary">
                  {visit.spineData.segments.filter((s) => s.status !== 'normal').length}
                </p>
                <p className="text-xs text-muted-foreground">Сегментов позвоночника</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-primary">
                  {visit.neuroTests.length}
                </p>
                <p className="text-xs text-muted-foreground">Тестов проведено</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-primary">
                  {visit.bodyRegions.regions.filter((r) => r.status !== 'neutral').length}
                </p>
                <p className="text-xs text-muted-foreground">Регионов отмечено</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 text-center">
                <p className="text-2xl font-bold text-primary">
                  {visit.muscleChains.chains.filter((c) => c.status === 'break').length}
                </p>
                <p className="text-xs text-muted-foreground">Цепей нарушено</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
