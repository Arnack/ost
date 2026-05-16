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

/** Interactive 2×2 grid where every cell toggles independently */
function PatternGrid({
  data,
  onChange,
}: {
  data: Grid4
  onChange: (key: keyof Grid4, value: GridValue) => void
}) {
  const cells: [keyof Grid4, string][] = [
    ['upperLeft',  'rounded-tl-lg'],
    ['upperRight', 'rounded-tr-lg'],
    ['lowerLeft',  'rounded-bl-lg'],
    ['lowerRight', 'rounded-br-lg'],
  ]
  return (
    <div className="grid grid-cols-2 gap-0.5 w-28 mx-auto">
      {cells.map(([key, rClass]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key, cycleValue(data[key]))}
          className={cn(
            'h-12 flex items-center justify-center text-lg font-bold border-2 transition-colors',
            rClass,
            cellClass(data[key])
          )}
        >
          {cellLabel(data[key])}
        </button>
      ))}
    </div>
  )
}

/** Feet diagram using the new SVG with 10 clickable toes per foot */
function FeetDiagram({
  selectedToe,
  onSelect,
}: {
  selectedToe: { left: number | null; right: number | null }
  onSelect: (foot: 'left' | 'right', toeNumber: number | null) => void
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
          const isSelected = selectedToe[toe.foot] === toe.number
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
            </g>
          )
        })}

        {/* Status text */}
        <text x="390" y="515" textAnchor="middle" className="fill-muted-foreground" fontSize="13">
          {selectedToe.left || selectedToe.right 
            ? `Левая: ${selectedToe.left ?? '—'} · Правая: ${selectedToe.right ?? '—'}`
            : 'нажми на цифру'
          }
        </text>
      </svg>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Нажмите на палец чтобы выбрать (только один на каждую стопу)
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

  const previousVisits = allVisits
    .filter((item) => item.id !== visit.id && new Date(item.date) < new Date(visit.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const getVisitPattern4 = (item: Visit, key: string): Grid4 => {
    const stored = item.gravityData[`pattern4_${key}` as keyof GravityData]
    if (stored && typeof stored === 'object' && 'upperLeft' in stored) return stored as Grid4
    const old = item.gravityData.patterns?.[key as keyof NonNullable<GravityData['patterns']>]
    const value = (old as GridValue) || 'neutral'
    return { upperLeft: value, upperRight: value, lowerLeft: value, lowerRight: value }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">

        <Card>
          <CardHeader>
            <CardTitle>Паттерны центров тяжести</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[auto_1fr]">
              <div className="rounded-lg border bg-muted/30 p-4 w-full lg:w-64">
                <p className="mb-4 text-sm font-semibold text-center">Эталонная схема</p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(referencePatterns).map((key) => (
                    <div key={key} className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground leading-tight">
                        {patternLabels[key]}
                      </p>
                      <ReferenceGrid pattern={referencePatterns[key]} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {Object.keys(patternLabels).map((key) => (
                  <div key={key} className="grid grid-cols-[1fr_auto] items-center gap-3">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-center">{patternLabels[key]}</p>
                      <PatternGrid
                        data={getPattern4(key)}
                        onChange={(cellKey, value) => setPattern4Cell(key, cellKey, value)}
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        Каждая ячейка независима
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-20 border-success/40 text-xs text-success hover:bg-success/10 hover:text-success"
                        onClick={() => setPattern4(key, referencePatterns[key])}
                      >
                        Норма
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 w-20 border-destructive/40 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setPatternDeviation(key)}
                      >
                        Отклон.
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Мезинец и линия тяжести</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <div className="rounded-xl border bg-muted/20 p-4">
                <FeetDiagram selectedToe={selectedToe} onSelect={selectToe} />
              </div>
              <div className="rounded-xl border bg-muted/20 p-4">
                <h3 className="text-sm font-medium">Предыдущие приёмы</h3>
                {previousVisits.length === 0 ? (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Нет сохранённых прошлых приёмов для сравнения динамики.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {previousVisits.map((previousVisit) => {
                      const leftToe = (previousVisit.gravityData as any).selectedToeLeft
                      const rightToe = (previousVisit.gravityData as any).selectedToeRight
                      return (
                        <div key={previousVisit.id} className="rounded-lg border bg-background p-3">
                          <p className="text-xs font-medium text-muted-foreground">
                            {new Date(previousVisit.date).toLocaleDateString('ru-RU')}
                          </p>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                            {Object.keys(patternLabels).map((key) => {
                              const pattern = getVisitPattern4(previousVisit, key)
                              return (
                                <div key={key}>
                                  <p className="text-muted-foreground">{patternLabels[key]}</p>
                                  <p className="font-medium">
                                    {pattern.upperLeft}/{pattern.upperRight} · {pattern.lowerLeft}/{pattern.lowerRight}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">
                            Пальцы: Л:{leftToe ?? '—'} · П:{rightToe ?? '—'}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weight distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение веса на ногах</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 xl:grid-cols-[1fr_1fr_auto]">
              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium">Вес пациента</h3>
                  <p className="text-xs text-muted-foreground">Введите фактический вес, распределение по ногам считается автоматически</p>
                </div>
                <FieldGroup className="grid gap-4 sm:grid-cols-3">
                  <Field>
                    <FieldLabel>Всего</FieldLabel>
                    <div className="relative">
                      <Input
                        type="number"
                        value={totalWeight}
                        onChange={(e) =>
                          handleTotalWeightChange(Number(e.target.value))
                        }
                        className="h-12 pr-10 text-center text-lg font-medium"
                        min={0}
                        step={0.1}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">кг</span>
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel>Левая нога</FieldLabel>
                    <div className="h-12 flex items-center justify-center rounded-md border bg-background text-lg font-medium">
                      {weightLeft.toFixed(1)} кг
                    </div>
                  </Field>
                  <Field>
                    <FieldLabel>Правая нога</FieldLabel>
                    <div className="h-12 flex items-center justify-center rounded-md border bg-background text-lg font-medium">
                      {weightRight.toFixed(1)} кг
                    </div>
                  </Field>
                </FieldGroup>
              </div>

              <div className="rounded-xl border bg-muted/20 p-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium">Энергозатраты</h3>
                  <p className="text-xs text-muted-foreground">Введите значения отдельно для левой и правой стороны</p>
                </div>
                <FieldGroup className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel>Левая сторона</FieldLabel>
                    <Input
                      type="number"
                      value={leftCost}
                      onChange={(e) =>
                        updateGravityData({ leftCost: Number(e.target.value) })
                      }
                      className="h-12 text-center text-lg font-medium"
                      min={0}
                    />
                  </Field>
                  <Field>
                    <FieldLabel>Правая сторона</FieldLabel>
                    <Input
                      type="number"
                      value={rightCost}
                      onChange={(e) =>
                        updateGravityData({ rightCost: Number(e.target.value) })
                      }
                      className="h-12 text-center text-lg font-medium"
                      min={0}
                    />
                  </Field>
                </FieldGroup>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 xl:w-72 xl:grid-cols-1">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-xs font-medium text-muted-foreground">Затраты всего</p>
                  <p className="mt-1 text-xl font-semibold">{totalCost.toFixed(1)}</p>
                </div>
                <div className={cn(
                  'rounded-xl border p-4',
                  costDifference > 0
                    ? 'border-warning/40 bg-warning/10'
                    : 'bg-muted/30'
                )}>
                  <p className="text-xs font-medium text-muted-foreground">Разница</p>
                  <p className="mt-1 text-xl font-semibold">{costDifference.toFixed(1)} кг</p>
                </div>
                <div className={cn(
                  'rounded-xl border p-4',
                  costRatio > 1
                    ? 'border-warning/40 bg-warning/10'
                    : 'bg-muted/30'
                )}>
                  <p className="text-xs font-medium text-muted-foreground">Превышение</p>
                  <p className="mt-1 text-xl font-semibold">{costRatio.toFixed(1)}×</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
