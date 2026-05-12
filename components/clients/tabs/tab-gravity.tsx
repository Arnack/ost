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

/** Feet diagram using the provided SVG with clickable toes */
function FeetDiagram({
  markedToes,
  onToggle,
}: {
  markedToes: Set<string>
  onToggle: (toeId: string) => void
}) {
  // Toe definitions: id, cx, cy, rx, ry, label, foot
  const toes = [
    // Left foot toes (anatomical left = viewer's right in the SVG)
    { id: 'lt1', cx: 386, cy: 174, rx: 18, ry: 22, label: '1', foot: 'left' },
    { id: 'lt2', cx: 414, cy: 162, rx: 14, ry: 19, label: '2', foot: 'left' },
    { id: 'lt3', cx: 441, cy: 166, rx: 13, ry: 18, label: '3', foot: 'left' },
    { id: 'lt4', cx: 466, cy: 172, rx: 12, ry: 16, label: '4', foot: 'left' },
    { id: 'lt5', cx: 490, cy: 184, rx: 10, ry: 13, label: '5', foot: 'left', isLittleToe: true },
    // Right foot toes
    { id: 'rt1', cx: 294, cy: 174, rx: 18, ry: 22, label: '1', foot: 'right' },
    { id: 'rt2', cx: 266, cy: 162, rx: 14, ry: 19, label: '2', foot: 'right' },
    { id: 'rt3', cx: 239, cy: 166, rx: 13, ry: 18, label: '3', foot: 'right' },
    { id: 'rt4', cx: 214, cy: 172, rx: 12, ry: 16, label: '4', foot: 'right' },
    { id: 'rt5', cx: 190, cy: 184, rx: 10, ry: 13, label: '5', foot: 'right', isLittleToe: true },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto">
      <svg width="100%" viewBox="0 0 680 520" xmlns="http://www.w3.org/2000/svg">
        {/* Right foot body */}
        <rect x="170" y="200" width="130" height="220" rx="18" className="fill-muted stroke-border" strokeWidth="1" />
        <rect x="182" y="390" width="106" height="60" rx="22" className="fill-muted stroke-border" strokeWidth="1" />
        <text x="235" y="490" textAnchor="middle" className="fill-muted-foreground" fontSize="13" fontWeight="500">Правая стопа</text>
        <text x="295" y="218" textAnchor="middle" className="fill-muted-foreground" fontSize="10">Med</text>
        <text x="175" y="218" textAnchor="middle" className="fill-muted-foreground" fontSize="10">Lat</text>

        {/* Left foot body */}
        <rect x="380" y="200" width="130" height="220" rx="18" className="fill-muted stroke-border" strokeWidth="1" />
        <rect x="392" y="390" width="106" height="60" rx="22" className="fill-muted stroke-border" strokeWidth="1" />
        <text x="445" y="490" textAnchor="middle" className="fill-muted-foreground" fontSize="13" fontWeight="500">Левая стопа</text>
        <text x="385" y="218" textAnchor="middle" className="fill-muted-foreground" fontSize="10">Med</text>
        <text x="505" y="218" textAnchor="middle" className="fill-muted-foreground" fontSize="10">Lat</text>

        {/* Divider */}
        <line x1="340" y1="160" x2="340" y2="460" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" className="text-border" />

        {/* Legend */}
        <rect x="210" y="50" width="260" height="36" rx="8" className="fill-muted stroke-border" strokeWidth="0.5" />
        <ellipse cx="234" cy="68" rx="10" ry="10" fill="#ef4444" stroke="#dc2626" strokeWidth="0.5" />
        <text x="250" y="68" className="fill-muted-foreground" fontSize="12" dominantBaseline="central">= отмеченный палец</text>

        {/* Toes */}
        {toes.map((toe) => {
          const isMarked = markedToes.has(toe.id)
          return (
            <g key={toe.id} onClick={() => onToggle(toe.id)} style={{ cursor: 'pointer' }}>
              {toe.isLittleToe && (
                <>
                  <line
                    x1={toe.cx}
                    y1={toe.cy + toe.ry + 4}
                    x2={toe.foot === 'left' ? toe.cx + 28 : toe.cx - 28}
                    y2={toe.cy + toe.ry + 26}
                    stroke="hsl(var(--destructive))"
                    strokeWidth="1"
                  />
                  <text
                    x={toe.foot === 'left' ? toe.cx + 32 : toe.cx - 32}
                    y={toe.cy + toe.ry + 30}
                    textAnchor={toe.foot === 'left' ? 'start' : 'end'}
                    className="fill-destructive"
                    fontSize="11"
                    fontWeight="600"
                  >
                    мизинец
                  </text>
                </>
              )}
              <ellipse
                cx={toe.cx}
                cy={toe.cy}
                rx={toe.rx}
                ry={toe.ry}
                fill={isMarked ? '#ef4444' : 'hsl(var(--muted))'}
                stroke={isMarked || toe.isLittleToe ? '#dc2626' : 'hsl(var(--border))'}
                strokeWidth={toe.isLittleToe ? '2' : '1'}
                className="transition-colors"
              />
              <text
                x={toe.cx}
                y={toe.cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="13"
                fontWeight="500"
                fill={isMarked ? 'white' : 'hsl(var(--muted-foreground))'}
              >
                {toe.label}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Нажмите на палец чтобы отметить его положение
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

  // Multi-toe marker support
  const markedToes = new Set<string>(
    (visit.gravityData as any).markedToes || []
  )
  const toggleToe = (toeId: string) => {
    const next = new Set(markedToes)
    if (next.has(toeId)) next.delete(toeId)
    else next.add(toeId)
    updateGravityData({ markedToes: Array.from(next) } as any)
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
                <FeetDiagram markedToes={markedToes} onToggle={toggleToe} />
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
                      const toes = previousVisit.gravityData.markedToes || []
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
                            Пальцы: {toes.length > 0 ? toes.join(', ') : '—'}
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
