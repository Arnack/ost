'use client'

import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import type { Visit, BodyRegion } from '@/lib/types'

interface TabBodyRegionsProps {
  visit: Visit
  onUpdate: (updates: Partial<Visit>) => void
}

// Body regions for front and back views
const frontRegions = [
  { id: 'head-front', name: 'Голова', x: 45, y: 5, width: 10, height: 8 },
  { id: 'neck-front', name: 'Шея', x: 45, y: 13, width: 10, height: 5 },
  { id: 'chest-left', name: 'Грудь Л', x: 35, y: 18, width: 15, height: 15 },
  { id: 'chest-right', name: 'Грудь П', x: 50, y: 18, width: 15, height: 15 },
  { id: 'abdomen-upper', name: 'Живот верх', x: 40, y: 33, width: 20, height: 10 },
  { id: 'abdomen-lower', name: 'Живот низ', x: 40, y: 43, width: 20, height: 10 },
  { id: 'pelvis-front', name: 'Таз', x: 38, y: 53, width: 24, height: 10 },
  { id: 'shoulder-left', name: 'Плечо Л', x: 25, y: 18, width: 10, height: 8 },
  { id: 'shoulder-right', name: 'Плечо П', x: 65, y: 18, width: 10, height: 8 },
  { id: 'arm-upper-left', name: 'Предплечье Л', x: 20, y: 26, width: 8, height: 15 },
  { id: 'arm-upper-right', name: 'Предплечье П', x: 72, y: 26, width: 8, height: 15 },
  { id: 'arm-lower-left', name: 'Кисть Л', x: 15, y: 41, width: 8, height: 15 },
  { id: 'arm-lower-right', name: 'Кисть П', x: 77, y: 41, width: 8, height: 15 },
  { id: 'thigh-left', name: 'Бедро Л', x: 35, y: 63, width: 12, height: 18 },
  { id: 'thigh-right', name: 'Бедро П', x: 53, y: 63, width: 12, height: 18 },
  { id: 'knee-left', name: 'Колено Л', x: 36, y: 81, width: 10, height: 5 },
  { id: 'knee-right', name: 'Колено П', x: 54, y: 81, width: 10, height: 5 },
  { id: 'shin-left', name: 'Голень Л', x: 36, y: 86, width: 10, height: 10 },
  { id: 'shin-right', name: 'Голень П', x: 54, y: 86, width: 10, height: 10 },
]

const backRegions = [
  { id: 'head-back', name: 'Затылок', x: 45, y: 5, width: 10, height: 8 },
  { id: 'neck-back', name: 'Шея зад', x: 45, y: 13, width: 10, height: 5 },
  { id: 'upper-back-left', name: 'Верх спины Л', x: 35, y: 18, width: 15, height: 12 },
  { id: 'upper-back-right', name: 'Верх спины П', x: 50, y: 18, width: 15, height: 12 },
  { id: 'mid-back-left', name: 'Сред спины Л', x: 35, y: 30, width: 15, height: 12 },
  { id: 'mid-back-right', name: 'Сред спины П', x: 50, y: 30, width: 15, height: 12 },
  { id: 'lower-back-left', name: 'Поясница Л', x: 35, y: 42, width: 15, height: 10 },
  { id: 'lower-back-right', name: 'Поясница П', x: 50, y: 42, width: 15, height: 10 },
  { id: 'sacrum', name: 'Крестец', x: 42, y: 52, width: 16, height: 8 },
  { id: 'glute-left', name: 'Ягодица Л', x: 35, y: 60, width: 15, height: 10 },
  { id: 'glute-right', name: 'Ягодица П', x: 50, y: 60, width: 15, height: 10 },
  { id: 'scapula-left', name: 'Лопатка Л', x: 28, y: 20, width: 8, height: 12 },
  { id: 'scapula-right', name: 'Лопатка П', x: 64, y: 20, width: 8, height: 12 },
  { id: 'hamstring-left', name: 'Задн бедро Л', x: 35, y: 70, width: 12, height: 15 },
  { id: 'hamstring-right', name: 'Задн бедро П', x: 53, y: 70, width: 12, height: 15 },
  { id: 'calf-left', name: 'Икра Л', x: 36, y: 85, width: 10, height: 12 },
  { id: 'calf-right', name: 'Икра П', x: 54, y: 85, width: 10, height: 12 },
]

export function TabBodyRegions({ visit, onUpdate }: TabBodyRegionsProps) {
  const [view, setView] = useState<'front' | 'back'>('front')

  const getRegionMeta = (regionId: string) => {
    if (regionId.includes('left')) {
      return { pairKey: regionId.replace('left', 'pair'), bodySide: 'left' as const }
    }
    if (regionId.includes('right')) {
      return { pairKey: regionId.replace('right', 'pair'), bodySide: 'right' as const }
    }
    return { pairKey: regionId, bodySide: 'center' as const }
  }

  // Get region status
  const getRegionStatus = (regionId: string): BodyRegion['status'] => {
    const region = visit.bodyRegions.regions.find((r) => r.id === regionId)
    return region?.status || 'neutral'
  }

  // Toggle region status
  const toggleRegion = (regionId: string, regionName: string, side: 'front' | 'back') => {
    const currentRegions = [...visit.bodyRegions.regions]
    const existingIndex = currentRegions.findIndex((r) => r.id === regionId)
    const statuses: BodyRegion['status'][] = ['neutral', '+', '-']
    const meta = getRegionMeta(regionId)

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
        ...meta,
      })
    }

    onUpdate({
      bodyRegions: {
        regions: currentRegions,
      },
    })
  }

  // Clear all regions
  const clearAllRegions = () => {
    onUpdate({
      bodyRegions: { regions: [] },
    })
  }

  // Body diagram component
  const BodyDiagram = ({ regions, side }: { regions: typeof frontRegions; side: 'front' | 'back' }) => (
    <div className="relative bg-muted/30 rounded-lg p-4">
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
                  status === 'neutral' && 'fill-muted/50 stroke-border',
                  status === '+' && 'fill-success/30 stroke-success',
                  status === '-' && 'fill-destructive/30 stroke-destructive'
                )}
                strokeWidth="0.5"
                onClick={() => toggleRegion(region.id, region.name, side)}
              />
              {status !== 'neutral' && (
                <text
                  x={region.x + region.width / 2}
                  y={region.y + region.height / 2 + 1.5}
                  textAnchor="middle"
                  className={cn(
                    'text-[4px] font-bold pointer-events-none',
                    status === '+' && 'fill-success',
                    status === '-' && 'fill-destructive'
                  )}
                >
                  {status}
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )

  // Get marked regions list
  const markedRegions = visit.bodyRegions.regions.filter((r) => r.status !== 'neutral')
  const primaryCausePairKeys = new Set(
    visit.bodyRegions.regions
      .filter((region) => region.status === '-' && region.bodySide !== 'center')
      .reduce<string[]>((keys, region, _, regions) => {
        const hasOppositeSide = regions.some(
          (candidate) =>
            candidate.pairKey === region.pairKey &&
            candidate.bodySide !== region.bodySide &&
            candidate.status === '-'
        )
        return hasOppositeSide && region.pairKey ? [...keys, region.pairKey] : keys
      }, [])
  )

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Регионы тела</CardTitle>
            <Button variant="outline" size="sm" onClick={clearAllRegions}>
              Очистить
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={view} onValueChange={(v) => setView(v as 'front' | 'back')}>
              <TabsList className="mb-4">
                <TabsTrigger value="front">Спереди</TabsTrigger>
                <TabsTrigger value="back">Сзади</TabsTrigger>
              </TabsList>

              <TabsContent value="front" className="mt-0">
                <BodyDiagram regions={frontRegions} side="front" />
              </TabsContent>

              <TabsContent value="back" className="mt-0">
                <BodyDiagram regions={backRegions} side="back" />
              </TabsContent>
            </Tabs>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-4 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success/30 border border-success" />
                <span className="text-sm">+ Гипертонус</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-destructive/30 border border-destructive" />
                <span className="text-sm">− Гипотонус</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-muted/50 border border-border" />
                <span className="text-sm">Норма</span>
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
                {markedRegions.map((region) => (
                  <div
                    key={region.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg border',
                      primaryCausePairKeys.has(region.pairKey || '') && 'bg-destructive/25 border-destructive',
                      region.status === '+' && 'bg-success/10 border-success/30',
                      region.status === '-' && 'bg-destructive/10 border-destructive/30'
                    )}
                  >
                    <span className="text-sm">
                      {region.name}
                      {primaryCausePairKeys.has(region.pairKey || '') && (
                        <span className="ml-1 text-xs text-destructive">причина</span>
                      )}
                    </span>
                    <span className={cn(
                      'font-bold',
                      region.status === '+' && 'text-success',
                      region.status === '-' && 'text-destructive'
                    )}>
                      {region.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
