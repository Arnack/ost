'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Visit, BodyRegion } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

interface TabBodyRegionsProps {
  visit: Visit
  allVisits?: Visit[]
  onUpdate: (updates: Partial<Visit>) => void
}

// Body regions for front view — each region has L/R pair info
const frontRegions = [
  { id: 'head-front-left',   name: 'Голова Л',         x: 42, y: 5,  width: 8,  height: 8,  bodySide: 'left' as const },
  { id: 'head-front-right',  name: 'Голова П',         x: 50, y: 5,  width: 8,  height: 8,  bodySide: 'right' as const },
  { id: 'neck-front-left',   name: 'Шея Л',            x: 43, y: 13, width: 7,  height: 5,  bodySide: 'left' as const },
  { id: 'neck-front-right',  name: 'Шея П',            x: 50, y: 13, width: 7,  height: 5,  bodySide: 'right' as const },
  { id: 'ribs-left',         name: 'Рёбра Л',          x: 35, y: 24, width: 15, height: 15, bodySide: 'left' as const },
  { id: 'ribs-right',        name: 'Рёбра П',          x: 50, y: 24, width: 15, height: 15, bodySide: 'right' as const },
  { id: 'chest-left',        name: 'Грудь Л',          x: 36, y: 18, width: 14, height: 8,  bodySide: 'left' as const },
  { id: 'chest-right',       name: 'Грудь П',          x: 50, y: 18, width: 14, height: 8,  bodySide: 'right' as const },
  { id: 'abdomen-upper',     name: 'Живот верх',       x: 40, y: 39, width: 20, height: 8,  bodySide: 'center' as const },
  { id: 'abdomen-lower',     name: 'Живот низ',        x: 40, y: 47, width: 20, height: 8,  bodySide: 'center' as const },
  { id: 'pelvis-front-left', name: 'Таз Л',            x: 38, y: 55, width: 12, height: 8,  bodySide: 'left' as const },
  { id: 'pelvis-front-right', name: 'Таз П',           x: 50, y: 55, width: 12, height: 8,  bodySide: 'right' as const },
  { id: 'shoulder-left',     name: 'Плечо Л',          x: 25, y: 18, width: 10, height: 8,  bodySide: 'left' as const },
  { id: 'shoulder-right',    name: 'Плечо П',          x: 65, y: 18, width: 10, height: 8,  bodySide: 'right' as const },
  { id: 'arm-upper-left',    name: 'Предплечье Л',     x: 20, y: 26, width: 8,  height: 15, bodySide: 'left' as const },
  { id: 'arm-upper-right',   name: 'Предплечье П',     x: 72, y: 26, width: 8,  height: 15, bodySide: 'right' as const },
  { id: 'arm-lower-left',    name: 'Кисть Л',          x: 16, y: 43, width: 7,  height: 10, bodySide: 'left' as const },
  { id: 'arm-lower-right',   name: 'Кисть П',          x: 77, y: 43, width: 7,  height: 10, bodySide: 'right' as const },
  { id: 'thigh-left',        name: 'Бедро Л',          x: 35, y: 63, width: 12, height: 17, bodySide: 'left' as const },
  { id: 'thigh-right',       name: 'Бедро П',          x: 53, y: 63, width: 12, height: 17, bodySide: 'right' as const },
  { id: 'knee-left',         name: 'Колено Л',         x: 35, y: 80, width: 12, height: 7,  bodySide: 'left' as const },
  { id: 'knee-right',        name: 'Колено П',         x: 53, y: 80, width: 12, height: 7,  bodySide: 'right' as const },
  { id: 'shin-left',         name: 'Голень Л',         x: 36, y: 87, width: 10, height: 9,  bodySide: 'left' as const },
  { id: 'shin-right',        name: 'Голень П',         x: 54, y: 87, width: 10, height: 9,  bodySide: 'right' as const },
  { id: 'foot-left',         name: 'Стопа Л',          x: 34, y: 96, width: 10, height: 4,  bodySide: 'left' as const },
  { id: 'foot-right',        name: 'Стопа П',          x: 56, y: 96, width: 10, height: 4,  bodySide: 'right' as const },
]

const backRegions = [
  { id: 'occiput-back',      name: 'Затылок',         x: 45, y: 5,  width: 10, height: 8,  bodySide: 'center' as const },
  { id: 'cervical-back-left', name: 'Шейный отдел Л', x: 44, y: 13, width: 6,  height: 6,  bodySide: 'left' as const },
  { id: 'cervical-back-right', name: 'Шейный отдел П', x: 50, y: 13, width: 6, height: 6,  bodySide: 'right' as const },
  { id: 'thoracic-back-left', name: 'Грудной отдел Л', x: 38, y: 19, width: 12, height: 18, bodySide: 'left' as const },
  { id: 'thoracic-back-right', name: 'Грудной отдел П', x: 50, y: 19, width: 12, height: 18, bodySide: 'right' as const },
  { id: 'lumbar-back-left',   name: 'Поясница Л',     x: 39, y: 37, width: 11, height: 13, bodySide: 'left' as const },
  { id: 'lumbar-back-right',  name: 'Поясница П',     x: 50, y: 37, width: 11, height: 13, bodySide: 'right' as const },
  { id: 'tailbone-back',     name: 'Копчик',          x: 45, y: 50, width: 10, height: 6,  bodySide: 'center' as const },
  { id: 'pelvis-back-left',  name: 'Таз Л',           x: 38, y: 56, width: 12, height: 9,  bodySide: 'left' as const },
  { id: 'pelvis-back-right', name: 'Таз П',           x: 50, y: 56, width: 12, height: 9,  bodySide: 'right' as const },
  { id: 'scapula-left',      name: 'Лопатка Л',       x: 28, y: 21, width: 10, height: 13, bodySide: 'left' as const },
  { id: 'scapula-right',     name: 'Лопатка П',       x: 62, y: 21, width: 10, height: 13, bodySide: 'right' as const },
  { id: 'hamstring-left',    name: 'Бедро Л',         x: 35, y: 65, width: 12, height: 17, bodySide: 'left' as const },
  { id: 'hamstring-right',   name: 'Бедро П',         x: 53, y: 65, width: 12, height: 17, bodySide: 'right' as const },
  { id: 'knee-back-left',    name: 'Колено Л',        x: 35, y: 82, width: 12, height: 6,  bodySide: 'left' as const },
  { id: 'knee-back-right',   name: 'Колено П',        x: 53, y: 82, width: 12, height: 6,  bodySide: 'right' as const },
  { id: 'calf-left',         name: 'Икра Л',          x: 36, y: 88, width: 10, height: 8,  bodySide: 'left' as const },
  { id: 'calf-right',        name: 'Икра П',          x: 54, y: 88, width: 10, height: 8,  bodySide: 'right' as const },
  { id: 'heel-left',         name: 'Пятка Л',         x: 35, y: 96, width: 9,  height: 4,  bodySide: 'left' as const },
  { id: 'heel-right',        name: 'Пятка П',         x: 56, y: 96, width: 9,  height: 4,  bodySide: 'right' as const },
]

/** Derive pair key from region id: strips -left/-right suffix */
function getPairKey(id: string): string | null {
  if (id.endsWith('-left'))  return id.slice(0, -5)
  if (id.endsWith('-right')) return id.slice(0, -6)
  if (id.includes('left'))   return id.replace('left', 'pair')
  if (id.includes('right'))  return id.replace('right', 'pair')
  return null
}

type BodyDiagramRegion = (typeof frontRegions)[number] | (typeof backRegions)[number]

export function TabBodyRegions({ visit, allVisits = [], onUpdate }: TabBodyRegionsProps) {
  // Get region status
  const getRegionStatus = (regionId: string): BodyRegion['status'] => {
    const region = visit.bodyRegions.regions.find((r) => r.id === regionId)
    return region?.status || 'neutral'
  }

  // Compute set of "primary cause" region ids:
  // if BOTH left and right variants of a region are "-"
  const primaryCauseIds = new Set<string>()
  const allRegions = [...frontRegions, ...backRegions]
  allRegions.forEach((reg) => {
    if (reg.bodySide === 'left') {
      const rightId = reg.id.replace('-left', '-right').replace('left', 'right')
      const leftStatus  = getRegionStatus(reg.id)
      const rightStatus = getRegionStatus(rightId)
      if (leftStatus === '-' && rightStatus === '-') {
        primaryCauseIds.add(reg.id)
        primaryCauseIds.add(rightId)
      }
    }
  })

  // Toggle region status
  const toggleRegion = (regionId: string, regionName: string, side: 'front' | 'back', bodySide: 'left' | 'right' | 'center') => {
    const currentRegions = [...visit.bodyRegions.regions]
    const existingIndex = currentRegions.findIndex((r) => r.id === regionId)
    const statuses: BodyRegion['status'][] = ['neutral', '+', '-']
    const pairKey = getPairKey(regionId)

    if (existingIndex >= 0) {
      const currentStatus = currentRegions[existingIndex].status
      const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length
      currentRegions[existingIndex] = {
        ...currentRegions[existingIndex],
        status: statuses[nextIndex],
      }
    } else {
      currentRegions.push({
        id: regionId,
        name: regionName,
        status: '+',
        side,
        bodySide,
        pairKey: pairKey || undefined,
      })
    }

    onUpdate({
      bodyRegions: { regions: currentRegions },
    })
  }

  const clearAllRegions = () => {
    onUpdate({ bodyRegions: { regions: [] } })
  }

  // Body diagram
  const BodyDiagram = ({ regions, side, title }: { regions: BodyDiagramRegion[]; side: 'front' | 'back'; title: string }) => (
    <div className="relative bg-muted/30 rounded-lg p-4">
      <h3 className="mb-3 text-center text-sm font-medium">{title}</h3>
      <svg viewBox="0 0 100 100" className="w-full max-w-xs mx-auto" style={{ aspectRatio: '1/1.2' }}>
        {/* Body outline */}
        <ellipse cx="50" cy="10" rx="8" ry="8" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
        <line x1="50" y1="18" x2="50" y2="55" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
        <line x1="50" y1="25" x2="25" y2="45" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
        <line x1="50" y1="25" x2="75" y2="45" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
        <line x1="42" y1="55" x2="38" y2="95" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
        <line x1="58" y1="55" x2="62" y2="95" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />

        {/* Clickable regions */}
        {regions.map((region) => {
          const status = getRegionStatus(region.id)
          const isPrimary = primaryCauseIds.has(region.id)
          return (
            <g key={region.id}>
              <rect
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                rx="1"
                className={cn(
                  'cursor-pointer transition-colors',
                  isPrimary && 'animate-pulse',
                  isPrimary              ? 'fill-destructive/70 stroke-destructive'
                    : status === 'neutral' ? 'fill-muted/50 stroke-border'
                    : status === '+'      ? 'fill-success/30 stroke-success'
                    :                        'fill-destructive/30 stroke-destructive'
                )}
                strokeWidth="0.5"
                onClick={() => toggleRegion(region.id, region.name, side, region.bodySide)}
              />
              {/* Status label inside cell */}
              {(status !== 'neutral' || isPrimary) && (
                <text
                  x={region.x + region.width / 2}
                  y={region.y + region.height / 2 + 1.5}
                  textAnchor="middle"
                  className={cn(
                    'text-[4px] font-bold pointer-events-none',
                    isPrimary       ? 'fill-white'
                    : status === '+' ? 'fill-success'
                    :                   'fill-destructive'
                  )}
                >
                  {isPrimary ? '!' : status}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )

  const markedRegions = visit.bodyRegions.regions.filter((r) => r.status !== 'neutral')
  const visitDate = format(parseISO(visit.date), 'd MMMM yyyy', { locale: ru })

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Регионы тела</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">Приём от {visitDate}</p>
            </div>
            <Button variant="outline" size="sm" onClick={clearAllRegions}>
              Очистить
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-2">
              <BodyDiagram regions={frontRegions} side="front" title="Спереди" />
              <BodyDiagram regions={backRegions} side="back" title="Сзади" />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-6 mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/30 border border-success" />
                <span className="text-sm">+ Стабильно</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/30 border border-destructive" />
                <span className="text-sm">− Нестабильно</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/70 border border-destructive animate-pulse" />
                <span className="text-sm font-medium text-destructive">! Первопричина (оба — «−»)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marked regions summary */}
        <Card>
          <CardHeader>
            <CardTitle>Отмеченные регионы</CardTitle>
          </CardHeader>
          <CardContent>
            {markedRegions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Нажмите на регион тела для отметки
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {markedRegions.map((region) => {
                  const isPrimary = primaryCauseIds.has(region.id)
                  return (
                    <div
                      key={region.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg border transition-colors',
                        isPrimary
                          ? 'bg-destructive/20 border-destructive'
                          : region.status === '+'
                            ? 'bg-success/10 border-success/30'
                            : 'bg-destructive/10 border-destructive/30'
                      )}
                    >
                      <span className="text-sm">
                        {region.name}
                        {isPrimary && (
                          <span className="ml-1 text-xs font-bold text-destructive">⚠ причина</span>
                        )}
                      </span>
                      <span className={cn(
                        'font-bold text-sm',
                        isPrimary       ? 'text-destructive'
                        : region.status === '+' ? 'text-success'
                        :                         'text-destructive'
                      )}>
                        {region.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Timeline across visits */}
        {allVisits.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Динамика по приёмам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...allVisits]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((v, idx, arr) => {
                    const vDate = format(parseISO(v.date), 'd MMM yyyy', { locale: ru })
                    const negative = v.bodyRegions.regions.filter((r) => r.status === '-')
                    const positive = v.bodyRegions.regions.filter((r) => r.status === '+')
                    const isCurrentVisit = v.id === visit.id

                    // Get region status for this visit
                    const getVisitRegionStatus = (regionId: string): BodyRegion['status'] => {
                      const region = v.bodyRegions.regions.find((r) => r.id === regionId)
                      return region?.status || 'neutral'
                    }

                    // Compute primary cause for this visit
                    const visitPrimaryCauseIds = new Set<string>()
                    const allRegionsList = [...frontRegions, ...backRegions]
                    allRegionsList.forEach((reg) => {
                      if (reg.bodySide === 'left') {
                        const rightId = reg.id.replace('-left', '-right').replace('left', 'right')
                        const leftStatus = getVisitRegionStatus(reg.id)
                        const rightStatus = getVisitRegionStatus(rightId)
                        if (leftStatus === '-' && rightStatus === '-') {
                          visitPrimaryCauseIds.add(reg.id)
                          visitPrimaryCauseIds.add(rightId)
                        }
                      }
                    })

                    // Mini body diagram component for timeline
                    const MiniBodyDiagram = ({ regions, side }: { regions: BodyDiagramRegion[]; side: 'front' | 'back' }) => (
                      <svg viewBox="0 0 100 100" className="w-full h-auto" style={{ aspectRatio: '1/1.2' }}>
                        {/* Body outline */}
                        <ellipse cx="50" cy="10" rx="8" ry="8" fill="none" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/50" />
                        <line x1="50" y1="18" x2="50" y2="55" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/50" />
                        <line x1="50" y1="25" x2="25" y2="45" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/50" />
                        <line x1="50" y1="25" x2="75" y2="45" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/50" />
                        <line x1="42" y1="55" x2="38" y2="95" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/50" />
                        <line x1="58" y1="55" x2="62" y2="95" stroke="currentColor" strokeWidth="0.8" className="text-muted-foreground/50" />

                        {/* Regions */}
                        {regions.map((region) => {
                          const status = getVisitRegionStatus(region.id)
                          const isPrimary = visitPrimaryCauseIds.has(region.id)
                          return (
                            <rect
                              key={region.id}
                              x={region.x}
                              y={region.y}
                              width={region.width}
                              height={region.height}
                              rx="1"
                              className={cn(
                                isPrimary              ? 'fill-destructive/70 stroke-destructive'
                                  : status === 'neutral' ? 'fill-muted/30 stroke-border'
                                  : status === '+'      ? 'fill-success/40 stroke-success'
                                  :                        'fill-destructive/40 stroke-destructive'
                              )}
                              strokeWidth="0.6"
                            />
                          )
                        })}
                      </svg>
                    )

                    return (
                      <div
                        key={v.id}
                        className={cn(
                          'rounded-lg border p-4',
                          isCurrentVisit && 'border-primary bg-primary/5'
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                              isCurrentVisit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            )}>
                              {arr.length - idx}
                            </span>
                            <span className="font-medium text-sm">{vDate}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="text-success">+{positive.length}</span>
                            <span className="text-destructive">−{negative.length}</span>
                          </div>
                        </div>

                        {/* Body diagrams for this visit */}
                        <div className="grid grid-cols-2 gap-4 mb-3">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">Спереди</span>
                            <div className="w-full max-w-[120px] bg-muted/20 rounded p-2">
                              <MiniBodyDiagram regions={frontRegions} side="front" />
                            </div>
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground mb-1">Сзади</span>
                            <div className="w-full max-w-[120px] bg-muted/20 rounded p-2">
                              <MiniBodyDiagram regions={backRegions} side="back" />
                            </div>
                          </div>
                        </div>

                        {/* Region chips */}
                        <div className="flex flex-wrap gap-1">
                          {negative.slice(0, 8).map((r) => (
                            <span key={r.id} className="rounded bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                              {r.name}
                            </span>
                          ))}
                          {negative.length > 8 && (
                            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              +{negative.length - 8} ещё
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
