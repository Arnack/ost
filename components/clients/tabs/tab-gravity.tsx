'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import type { Visit, GravityData } from '@/lib/types'

interface TabGravityProps {
  visit: Visit
  allVisits?: Visit[]
  onUpdate: (updates: Partial<Visit>) => void
}

type GridValue = '+' | '-' | 'neutral'

// Extended 4-cell grid type (each cell independent)
type Grid4 = {
  upperLeft: GridValue
  upperRight: GridValue
  lowerLeft: GridValue
  lowerRight: GridValue
}

// Reference patterns showing the "correct" state for each pattern
const referencePatterns: Record<string, Grid4> = {
  breathing:   { upperLeft: '+', upperRight: '+', lowerLeft: '-', lowerRight: '-' },
  rightStep:   { upperLeft: '+', upperRight: '-', lowerLeft: '-', lowerRight: '+' },
  leftStep:    { upperLeft: '-', upperRight: '+', lowerLeft: '+', lowerRight: '-' },
  vertical:    { upperLeft: '-', upperRight: '-', lowerLeft: '+', lowerRight: '+' },
}

const patternLabels: Record<string, string> = {
  breathing:  'Паттерн дыхания',
  rightStep:  'Паттерн правого шага',
  leftStep:   'Паттерн левого шага',
  vertical:   'Паттерн вертикали',
}

function cycleValue(current: GridValue): GridValue {
  const values: GridValue[] = ['neutral', '+', '-']
  return values[(values.indexOf(current) + 1) % values.length]
}

function cellClass(value: GridValue) {
  if (value === '+') return 'bg-success/20 border-success text-success'
  if (value === '-') return 'bg-destructive/20 border-destructive text-destructive'
  return 'bg-muted border-border text-muted-foreground'
}

function cellLabel(value: GridValue) {
  return value === 'neutral' ? '○' : value
}

/** Static reference 2×2 grid (read-only) */
function ReferenceGrid({ pattern }: { pattern: Grid4 }) {
  const cells: [keyof Grid4, string, string][] = [
    ['upperLeft',  'rounded-tl-lg', ''],
    ['upperRight', 'rounded-tr-lg', ''],
    ['lowerLeft',  'rounded-bl-lg', ''],
    ['lowerRight', 'rounded-br-lg', ''],
  ]
  return (
    <div className="grid grid-cols-2 gap-0.5 w-24 mx-auto">
      {cells.map(([key, rClass]) => (
        <div
          key={key}
          className={cn(
            'h-10 flex items-center justify-center text-base font-bold border',
            rClass,
            cellClass(pattern[key])
          )}
        >
          {cellLabel(pattern[key])}
        </div>
      ))}
    </div>
  )
}

/** Mini 2×2 grid for comparison tables */
function MiniPatternGrid({ pattern }: { pattern: Grid4 }) {
  const cells: [keyof Grid4, string][] = [
    ['upperLeft',  'rounded-tl'],
    ['upperRight', 'rounded-tr'],
    ['lowerLeft',  'rounded-bl'],
    ['lowerRight', 'rounded-br'],
  ]
  return (
    <div className="grid grid-cols-2 gap-0.5 w-10 mx-auto">
      {cells.map(([key, rClass]) => (
        <div
          key={key}
          className={cn(
            'h-4 flex items-center justify-center text-[8px] font-bold border',
            rClass,
            cellClass(pattern[key])
          )}
        >
          {cellLabel(pattern[key])}
        </div>
      ))}
    </div>
  )
}

/** Mini feet SVG for comparison tables */
function MiniFeet({ selectedToe }: { selectedToe: { left: number | null; right: number | null } }) {
  const toes = [
    // Left foot toes
    { cx: 15, cy: 35, rx: 3, ry: 4, foot: 'left' as const, number: 1 },
    { cx: 20, cy: 33, rx: 3, ry: 3, foot: 'left' as const, number: 2 },
    { cx: 25, cy: 33, rx: 3, ry: 3, foot: 'left' as const, number: 3 },
    { cx: 30, cy: 33, rx: 3, ry: 3, foot: 'left' as const, number: 4 },
    { cx: 35, cy: 35, rx: 3, ry: 4, foot: 'left' as const, number: 5 },
    // Right foot toes
    { cx: 55, cy: 35, rx: 3, ry: 4, foot: 'right' as const, number: 1 },
    { cx: 50, cy: 33, rx: 3, ry: 3, foot: 'right' as const, number: 2 },
    { cx: 45, cy: 33, rx: 3, ry: 3, foot: 'right' as const, number: 3 },
    { cx: 40, cy: 33, rx: 3, ry: 3, foot: 'right' as const, number: 4 },
    { cx: 35, cy: 35, rx: 3, ry: 4, foot: 'right' as const, number: 5 },
  ]

  return (
    <svg width="70" height="50" viewBox="0 0 70 50" xmlns="http://www.w3.org/2000/svg">
      {/* Left foot body */}
      <ellipse cx="25" cy="25" rx="12" ry="18" className="fill-muted stroke-border" strokeWidth="0.5" />
      {/* Right foot body */}
      <ellipse cx="45" cy="25" rx="12" ry="18" className="fill-muted stroke-border" strokeWidth="0.5" />
      
      {/* Toes */}
      {toes.map((toe) => {
        const isSelected = selectedToe[toe.foot] === toe.number
        return (
          <ellipse
            key={`${toe.foot}-${toe.number}`}
            cx={toe.cx}
            cy={toe.cy}
            rx={toe.rx}
            ry={toe.ry}
            fill={isSelected ? '#ef4444' : 'hsl(var(--muted))'}
            stroke={isSelected ? '#dc2626' : 'hsl(var(--border))'}
            strokeWidth="0.5"
          />
        )
      })}
    </svg>
  )
}

/** Mini toe circles for comparison tables */
function MiniToeCircles({ selectedToe }: { selectedToe: number | null }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
        const isSelected = selectedToe === num
        const isVirtual = num > 5
        return (
          <div
            key={num}
            className={cn(
              'w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : isVirtual
                  ? 'border border-dashed border-muted-foreground/30 text-muted-foreground/30'
                  : 'bg-muted text-muted-foreground'
            )}
          >
            {isSelected ? num : ''}
          </div>
        )
      })}
    </div>
  )
}

/** Interactive 2×2 grid where every cell toggles independently */
function PatternGrid({
  data,
  onChange,
  previousData,
}: {
  data: Grid4
  onChange: (key: keyof Grid4, value: GridValue) => void
  previousData?: Grid4
}) {
  const cells: [keyof Grid4, string][] = [
    ['upperLeft',  'rounded-tl-lg'],
    ['upperRight', 'rounded-tr-lg'],
    ['lowerLeft',  'rounded-bl-lg'],
    ['lowerRight', 'rounded-br-lg'],
  ]
  return (
    <div className="grid grid-cols-2 gap-0.5 w-28 mx-auto relative">
      {cells.map(([key, rClass]) => {
        const prevValue = previousData?.[key]
        const hasChange = prevValue && prevValue !== data[key]
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key, cycleValue(data[key]))}
            className={cn(
              'h-12 flex items-center justify-center text-lg font-bold border-2 transition-colors relative',
              rClass,
              cellClass(data[key])
            )}
          >
            {cellLabel(data[key])}
            {hasChange && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-warning text-warning-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                {cellLabel(prevValue!)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Feet diagram using the new SVG with 10 clickable toes per foot */
function FeetDiagram({
  selectedToe,
  onSelect,
  previousToe,
}: {
  selectedToe: { left: number | null; right: number | null }
  onSelect: (foot: 'left' | 'right', toeNumber: number | null) => void
  previousToe?: { left: number | null; right: number | null }
}) {
  // Toe definitions matching the new SVG coordinates
  // Left foot (a suffix): 1-10
  // Right foot (b suffix): 1-10
  const toes = [
    // Left foot toes
    { id: 'c1a', cx: 118, cy: 404, rx: 11, ry: 13, label: '1', foot: 'left', number: 1 },
    { id: 'c2a', cx: 144, cy: 412, rx: 12, ry: 14, label: '2', foot: 'left', number: 2 },
    { id: 'c3a', cx: 173, cy: 415, rx: 13, ry: 15, label: '3', foot: 'left', number: 3 },
    { id: 'c4a', cx: 202, cy: 412, rx: 12, ry: 14, label: '4', foot: 'left', number: 4 },
    { id: 'c5a', cx: 230, cy: 404, rx: 16, ry: 17, label: '5', foot: 'left', number: 5 },
    { id: 'c6a', cx: 257, cy: 396, rx: 14, ry: 15, label: '6', foot: 'left', number: 6, isGhost: true },
    { id: 'c7a', cx: 279, cy: 388, rx: 12, ry: 13, label: '7', foot: 'left', number: 7, isGhost: true },
    { id: 'c8a', cx: 298, cy: 381, rx: 11, ry: 12, label: '8', foot: 'left', number: 8, isGhost: true },
    { id: 'c9a', cx: 314, cy: 375, rx: 10, ry: 11, label: '9', foot: 'left', number: 9, isGhost: true },
    { id: 'c10a', cx: 328, cy: 369, rx: 9, ry: 10, label: '10', foot: 'left', number: 10, isGhost: true },
    // Right foot toes
    { id: 'c1b', cx: 662, cy: 404, rx: 11, ry: 13, label: '1', foot: 'right', number: 1 },
    { id: 'c2b', cx: 636, cy: 412, rx: 12, ry: 14, label: '2', foot: 'right', number: 2 },
    { id: 'c3b', cx: 607, cy: 415, rx: 13, ry: 15, label: '3', foot: 'right', number: 3 },
    { id: 'c4b', cx: 578, cy: 412, rx: 12, ry: 14, label: '4', foot: 'right', number: 4 },
    { id: 'c5b', cx: 550, cy: 404, rx: 16, ry: 17, label: '5', foot: 'right', number: 5 },
    { id: 'c6b', cx: 523, cy: 396, rx: 14, ry: 15, label: '6', foot: 'right', number: 6, isGhost: true },
    { id: 'c7b', cx: 501, cy: 388, rx: 12, ry: 13, label: '7', foot: 'right', number: 7, isGhost: true },
    { id: 'c8b', cx: 482, cy: 381, rx: 11, ry: 12, label: '8', foot: 'right', number: 8, isGhost: true },
    { id: 'c9b', cx: 466, cy: 375, rx: 10, ry: 11, label: '9', foot: 'right', number: 9, isGhost: true },
    { id: 'c10b', cx: 452, cy: 369, rx: 9, ry: 10, label: '10', foot: 'right', number: 10, isGhost: true },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto">
      <svg width="100%" viewBox="0 0 780 530" xmlns="http://www.w3.org/2000/svg">
        {/* Left foot body */}
        <ellipse cx="175" cy="265" rx="65" ry="105" className="fill-muted stroke-border" strokeWidth="0.5" />
        <ellipse cx="175" cy="368" rx="70" ry="28" className="fill-muted stroke-border" strokeWidth="0.5" />
        <rect x="110" y="250" width="130" height="130" rx="6" opacity="0.55" className="fill-muted stroke-border" strokeWidth="0.5" />
        <text x="175" y="148" textAnchor="middle" className="fill-muted-foreground" fontSize="11">левая</text>

        {/* Right foot body */}
        <ellipse cx="605" cy="265" rx="65" ry="105" className="fill-muted stroke-border" strokeWidth="0.5" />
        <ellipse cx="605" cy="368" rx="70" ry="28" className="fill-muted stroke-border" strokeWidth="0.5" />
        <rect x="540" y="250" width="130" height="130" rx="6" opacity="0.55" className="fill-muted stroke-border" strokeWidth="0.5" />
        <text x="605" y="148" textAnchor="middle" className="fill-muted-foreground" fontSize="11">правая</text>

        {/* Legend */}
        <rect x="280" y="50" width="220" height="36" rx="8" className="fill-muted stroke-border" strokeWidth="0.5" />
        <ellipse cx="304" cy="68" rx="10" ry="10" fill="#ef4444" stroke="#dc2626" strokeWidth="0.5" />
        <text x="320" y="68" className="fill-muted-foreground" fontSize="12" dominantBaseline="central">= выбранный палец</text>

        {/* Toes */}
        {toes.map((toe) => {
          const isSelected = selectedToe[toe.foot as 'left' | 'right'] === toe.number
          const wasSelected = previousToe?.[toe.foot as 'left' | 'right'] === toe.number
          const hasChange = wasSelected && !isSelected
          return (
            <g key={toe.id} onClick={() => onSelect(toe.foot, isSelected ? null : toe.number)} style={{ cursor: 'pointer' }}>
              <ellipse
                cx={toe.cx}
                cy={toe.cy}
                rx={toe.rx}
                ry={toe.ry}
                fill={isSelected ? '#ef4444' : toe.isGhost ? 'none' : 'hsl(var(--muted))'}
                stroke={isSelected ? '#dc2626' : toe.isGhost ? 'hsl(var(--border))' : 'hsl(var(--border))'}
                strokeWidth={toe.isGhost ? '0.5' : isSelected ? '1' : '0.5'}
                strokeDasharray={toe.isGhost ? '3 3' : undefined}
                className="transition-colors"
              />
              <text
                x={toe.cx}
                y={toe.cy + (toe.isGhost ? 23 : 22)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fontWeight="500"
                fill={isSelected ? 'white' : 'hsl(var(--muted-foreground))'}
                opacity={toe.isGhost ? 0.3 : 1}
              >
                {toe.label}
              </text>
              {hasChange && (
                <circle
                  cx={toe.cx + 8}
                  cy={toe.cy - 8}
                  r="6"
                  fill="hsl(var(--warning))"
                  stroke="hsl(var(--warning-foreground))"
                  strokeWidth="1"
                />
              )}
            </g>
          )
        })}

        {/* Status text */}
        <text x="390" y="515" textAnchor="middle" className="fill-muted-foreground" fontSize="13">
          {selectedToe.left || selectedToe.right 
            ? `Правая: ${selectedToe.left ?? '—'} · Левая: ${selectedToe.right ?? '—'}`
            : 'нажми на цифру'
          }
        </text>
      </svg>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Нажмите на цифру чтобы выбрать (только один на каждую стопу)
      </p>
    </div>
  )
}

export function TabGravity({ visit, allVisits = [], onUpdate }: TabGravityProps) {
  const updateGravityData = (updates: Partial<GravityData>) => {
    onUpdate({
      gravityData: {
        ...visit.gravityData,
        ...updates,
      },
    })
  }

  // Get 4-cell pattern for a given pattern key
  const getPattern4 = (key: string): Grid4 => {
    const stored = (visit.gravityData as any)[`pattern4_${key}`]
    if (stored) return stored
    // Fallback: convert old single-value to all-cells
    const old = visit.gravityData.patterns?.[key as keyof typeof visit.gravityData.patterns]
    const v: GridValue = (old as GridValue) || 'neutral'
    return { upperLeft: v, upperRight: v, lowerLeft: v, lowerRight: v }
  }

  const setPattern4Cell = (patternKey: string, cellKey: keyof Grid4, value: GridValue) => {
    const current = getPattern4(patternKey)
    const updated = { ...current, [cellKey]: value }
    updateGravityData({ [`pattern4_${patternKey}`]: updated } as any)
  }

  const setPattern4 = (patternKey: string, value: Grid4) => {
    updateGravityData({ [`pattern4_${patternKey}`]: value } as any)
  }

  const setPatternDeviation = (patternKey: string) => {
    setPattern4(patternKey, {
      upperLeft: '-',
      upperRight: '-',
      lowerLeft: '-',
      lowerRight: '-',
    })
  }

  // Single-toe selection per foot
  const selectedToe = {
    left: (visit.gravityData as any).selectedToeLeft ?? null,
    right: (visit.gravityData as any).selectedToeRight ?? null,
  }
  const selectToe = (foot: 'left' | 'right', toeNumber: number | null) => {
    const updates: any = {}
    if (foot === 'left') {
      updates.selectedToeLeft = toeNumber
    } else {
      updates.selectedToeRight = toeNumber
    }
    updateGravityData(updates)
  }

  const savedTotalWeight = visit.gravityData.totalWeight ?? 0
  const savedLegWeight = visit.gravityData.weightLeft + visit.gravityData.weightRight
  const totalWeight = savedTotalWeight > 0 ? savedTotalWeight : savedLegWeight
  const weightLeft = totalWeight / 2
  const weightRight = totalWeight / 2
  const leftCost = visit.gravityData.leftCost || 0
  const rightCost = visit.gravityData.rightCost || 0
  const totalCost = leftCost + rightCost
  const costDifference = totalCost - totalWeight
  const costRatio = totalWeight > 0 ? totalCost / totalWeight : 0
  const handleTotalWeightChange = (value: number) => {
    updateGravityData({
      totalWeight: value,
      weightLeft: value / 2,
      weightRight: value / 2,
    })
  }

  const getVisitPattern4 = (item: Visit, key: string): Grid4 => {
    const stored = item.gravityData[`pattern4_${key}` as keyof GravityData]
    if (stored && typeof stored === 'object' && 'upperLeft' in stored) return stored as Grid4
    const old = item.gravityData.patterns?.[key as keyof NonNullable<GravityData['patterns']>]
    const value = (old as GridValue) || 'neutral'
    return { upperLeft: value, upperRight: value, lowerLeft: value, lowerRight: value }
  }

  const previousVisits = allVisits
    .filter((item) => item.id !== visit.id && new Date(item.date) < new Date(visit.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const previousVisit = previousVisits[0]
  const previousPatternData = previousVisit ? {
    breathing: getVisitPattern4(previousVisit, 'breathing'),
    rightStep: getVisitPattern4(previousVisit, 'rightStep'),
    leftStep: getVisitPattern4(previousVisit, 'leftStep'),
    vertical: getVisitPattern4(previousVisit, 'vertical'),
  } : undefined

  const previousToeData = previousVisit ? {
    left: (previousVisit.gravityData as any).selectedToeLeft ?? null,
    right: (previousVisit.gravityData as any).selectedToeRight ?? null,
  } : undefined

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Паттерны центров тяжести</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 items-start gap-4 sm:gap-6 lg:grid-cols-[auto_1fr]">
              <div className="rounded-lg border bg-muted/30 p-3 sm:p-4 w-full lg:w-64">
                <p className="mb-3 sm:mb-4 text-xs sm:text-sm font-semibold text-center">Эталонная схема</p>
                <div className="grid grid-cols-2 gap-2 sm:gap-4">
                  {Object.keys(referencePatterns).map((key) => (
                    <div key={key} className="space-y-1 sm:space-y-2">
                      <p className="text-[10px] sm:text-xs text-center text-muted-foreground leading-tight">
                        {patternLabels[key]}
                      </p>
                      <ReferenceGrid pattern={referencePatterns[key]} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Object.keys(patternLabels).map((key) => (
                  <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-2 sm:gap-3">
                    <div className="space-y-1 sm:space-y-2">
                      <p className="text-xs sm:text-sm font-medium text-center">{patternLabels[key]}</p>
                      <PatternGrid
                        data={getPattern4(key)}
                        previousData={previousPatternData?.[key as keyof typeof previousPatternData]}
                        onChange={(cellKey, value) => setPattern4Cell(key, cellKey, value)}
                      />
                      <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                        Каждая ячейка независима
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 sm:h-8 w-14 sm:w-16 border-success/40 text-[10px] sm:text-xs text-success hover:bg-success/10 hover:text-success"
                        onClick={() => setPattern4(key, referencePatterns[key])}
                      >
                        Норма
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-7 sm:h-8 w-14 sm:w-16 border-destructive/40 text-[10px] sm:text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPatternDeviation(key)}
                      >
                        Отклон.
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {previousVisits.length > 0 && (
              <div className="mt-4 sm:mt-6 rounded-lg border bg-muted/20 p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium mb-3">Сравнение с предыдущими приёмами</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] sm:text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-muted-foreground">Паттерн</th>
                        <th className="text-center p-2 font-medium text-accent">Текущий</th>
                        {previousVisits.map((pv) => (
                          <th key={pv.id} className="text-center p-2 font-medium text-muted-foreground whitespace-nowrap">
                            {new Date(pv.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(patternLabels).map((key) => (
                        <tr key={key} className="border-b last:border-0">
                          <td className="p-2 text-muted-foreground whitespace-nowrap">
                            {patternLabels[key]}
                          </td>
                          <td className="p-2 text-center bg-accent/30">
                            <MiniPatternGrid pattern={getPattern4(key)} />
                          </td>
                          {previousVisits.map((pv) => {
                            const pattern = getVisitPattern4(pv, key)
                            return (
                              <td key={pv.id} className="p-2 text-center">
                                <MiniPatternGrid pattern={pattern} />
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Мезинец и линия тяжести</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-1">
              <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <FeetDiagram selectedToe={selectedToe} onSelect={selectToe} previousToe={previousToeData} />
              </div>
            </div>

            {previousVisits.length > 0 && (
              <div className="mt-4 sm:mt-6 rounded-lg border bg-muted/20 p-3 sm:p-4">
                <h3 className="text-xs sm:text-sm font-medium mb-3">Сравнение с предыдущими приёмами</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px] sm:text-xs">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-muted-foreground">Стопа</th>
                        <th className="text-center p-2 font-medium text-accent">Текущий</th>
                        {previousVisits.map((pv) => (
                          <th key={pv.id} className="text-center p-2 font-medium text-muted-foreground whitespace-nowrap">
                            {new Date(pv.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-2 text-muted-foreground whitespace-nowrap">Правая</td>
                        <td className="p-2 text-center bg-accent/30">
                          <MiniToeCircles selectedToe={selectedToe.left} />
                        </td>
                        {previousVisits.map((pv) => {
                          const leftToe = (pv.gravityData as any).selectedToeLeft ?? null
                          return (
                            <td key={pv.id} className="p-2 text-center">
                              <MiniToeCircles selectedToe={leftToe} />
                            </td>
                          )
                        })}
                      </tr>
                      <tr>
                        <td className="p-2 text-muted-foreground whitespace-nowrap">Левая</td>
                        <td className="p-2 text-center bg-accent/30">
                          <MiniToeCircles selectedToe={selectedToe.right} />
                        </td>
                        {previousVisits.map((pv) => {
                          const rightToe = (pv.gravityData as any).selectedToeRight ?? null
                          return (
                            <td key={pv.id} className="p-2 text-center">
                              <MiniToeCircles selectedToe={rightToe} />
                            </td>
                          )
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weight distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение веса на ногах</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1fr_1fr_auto] xl:grid-cols-[1fr_1fr_auto]">
              <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-medium">Вес пациента</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Введите фактический вес, распределение по ногам считается автоматически</p>
                </div>
                <FieldGroup className="grid gap-3 sm:gap-4 grid-cols-3">
                  <Field>
                    <FieldLabel className="text-[10px] sm:text-xs">Всего</FieldLabel>
                    <div className="relative">
                      <Input
                        type="number"
                        value={totalWeight}
                        onChange={(e) =>
                          handleTotalWeightChange(Number(e.target.value))
                        }
                        className="h-10 sm:h-12 pr-8 sm:pr-10 text-center text-base sm:text-lg font-medium"
                        min={0}
                        step={0.1}
                      />
                      <span className="pointer-events-none absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-sm text-muted-foreground">кг</span>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel className="text-[10px] sm:text-xs">Левая нога</FieldLabel>
                    <div className="h-10 sm:h-12 flex items-center justify-center rounded-md border bg-background text-base sm:text-lg font-medium">
                      {weightLeft.toFixed(1)} кг
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel className="text-[10px] sm:text-xs">Правая нога</FieldLabel>
                    <div className="h-10 sm:h-12 flex items-center justify-center rounded-md border bg-background text-base sm:text-lg font-medium">
                      {weightRight.toFixed(1)} кг
                    </div>
                  </Field>
                </FieldGroup>
              </div>

              <div className="rounded-xl border bg-muted/20 p-3 sm:p-4">
                <div className="mb-3 sm:mb-4">
                  <h3 className="text-xs sm:text-sm font-medium">Энергозатраты</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Введите значения отдельно для левой и правой стороны</p>
                </div>
                <FieldGroup className="grid gap-3 sm:gap-4 grid-cols-2">
                  <Field>
                    <FieldLabel className="text-[10px] sm:text-xs">Левая сторона</FieldLabel>
                    <Input
                      type="number"
                      value={leftCost}
                      onChange={(e) =>
                        updateGravityData({ leftCost: Number(e.target.value) })
                      }
                      className="h-10 sm:h-12 text-center text-base sm:text-lg font-medium"
                      min={0}
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-[10px] sm:text-xs">Правая сторона</FieldLabel>
                    <Input
                      type="number"
                      value={rightCost}
                      onChange={(e) =>
                        updateGravityData({ rightCost: Number(e.target.value) })
                      }
                      className="h-10 sm:h-12 text-center text-base sm:text-lg font-medium"
                      min={0}
                    />
                  </Field>
                </FieldGroup>
              </div>

              <div className="grid gap-2 sm:gap-3 grid-cols-3 sm:grid-cols-1 xl:w-72 xl:grid-cols-1">
                <div className="rounded-xl border bg-muted/30 p-2 sm:p-4">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Затраты всего</p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold">{totalCost.toFixed(1)}</p>
                </div>
                <div className={cn(
                  'rounded-xl border p-2 sm:p-4',
                  costDifference > 0
                    ? 'border-warning/40 bg-warning/10'
                    : 'bg-muted/30'
                )}>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Разница</p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold">{costDifference.toFixed(1)} кг</p>
                </div>
                <div className={cn(
                  'rounded-xl border p-2 sm:p-4',
                  costRatio > 1
                    ? 'border-warning/40 bg-warning/10'
                    : 'bg-muted/30'
                )}>
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground">Превышение</p>
                  <p className="mt-1 text-lg sm:text-xl font-semibold">{costRatio.toFixed(1)}×</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
