'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { FieldGroup, Field, FieldLabel } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import type { Visit, GravityData } from '@/lib/types'

interface TabGravityProps {
  visit: Visit
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
  vertical:    { upperLeft: '+', upperRight: '+', lowerLeft: '+', lowerRight: '+' },
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
    { id: 'lt1', cx: 393, cy: 174, rx: 18, ry: 22, label: '1', foot: 'left' },
    { id: 'lt2', cx: 414, cy: 162, rx: 14, ry: 19, label: '2', foot: 'left' },
    { id: 'lt3', cx: 435, cy: 166, rx: 13, ry: 18, label: '3', foot: 'left' },
    { id: 'lt4', cx: 454, cy: 172, rx: 12, ry: 16, label: '4', foot: 'left' },
    { id: 'lt5', cx: 471, cy: 182, rx: 10, ry: 13, label: '5', foot: 'left' },
    // Right foot toes
    { id: 'rt1', cx: 287, cy: 174, rx: 18, ry: 22, label: '1', foot: 'right' },
    { id: 'rt2', cx: 266, cy: 162, rx: 14, ry: 19, label: '2', foot: 'right' },
    { id: 'rt3', cx: 245, cy: 166, rx: 13, ry: 18, label: '3', foot: 'right' },
    { id: 'rt4', cx: 226, cy: 172, rx: 12, ry: 16, label: '4', foot: 'right' },
    { id: 'rt5', cx: 209, cy: 182, rx: 10, ry: 13, label: '5', foot: 'right' },
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
              <ellipse
                cx={toe.cx}
                cy={toe.cy}
                rx={toe.rx}
                ry={toe.ry}
                fill={isMarked ? '#ef4444' : 'hsl(var(--muted))'}
                stroke={isMarked ? '#dc2626' : 'hsl(var(--border))'}
                strokeWidth="1"
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

export function TabGravity({ visit, onUpdate }: TabGravityProps) {
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

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">

        {/* Pattern grids */}
        <Card>
          <CardHeader>
            <CardTitle>Паттерны центров тяжести</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
              {/* Reference column */}
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

              {/* Interactive grids */}
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {Object.keys(patternLabels).map((key) => (
                  <div key={key} className="space-y-2">
                    <p className="text-sm font-medium text-center">{patternLabels[key]}</p>
                    <PatternGrid
                      data={getPattern4(key)}
                      onChange={(cellKey, value) => setPattern4Cell(key, cellKey, value)}
                    />
                    <p className="text-xs text-muted-foreground text-center">
                      Каждая ячейка независима
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feet diagram */}
        <Card>
          <CardHeader>
            <CardTitle>Схема ступней — нумерация пальцев 1–5</CardTitle>
          </CardHeader>
          <CardContent>
            <FeetDiagram markedToes={markedToes} onToggle={toggleToe} />
          </CardContent>
        </Card>

        {/* Weight distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение веса на ногах</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup className="flex flex-wrap justify-center gap-8">
              <Field className="w-32">
                <FieldLabel>Левая нога (кг)</FieldLabel>
                <Input
                  type="number"
                  value={visit.gravityData.weightLeft}
                  onChange={(e) =>
                    updateGravityData({ weightLeft: Number(e.target.value) })
                  }
                  className="h-11 text-center text-lg"
                  min={0}
                  step={0.1}
                />
              </Field>
              <Field className="w-32">
                <FieldLabel>Правая нога (кг)</FieldLabel>
                <Input
                  type="number"
                  value={visit.gravityData.weightRight}
                  onChange={(e) =>
                    updateGravityData({ weightRight: Number(e.target.value) })
                  }
                  className="h-11 text-center text-lg"
                  min={0}
                  step={0.1}
                />
              </Field>
              <Field className="w-32">
                <FieldLabel>Всего</FieldLabel>
                <div className="h-11 flex items-center justify-center text-lg font-medium bg-muted rounded-md">
                  {(visit.gravityData.weightLeft + visit.gravityData.weightRight).toFixed(1)} кг
                </div>
              </Field>
              <Field className="w-32">
                <FieldLabel>Затраты Л</FieldLabel>
                <Input
                  type="number"
                  value={visit.gravityData.leftCost || 0}
                  onChange={(e) =>
                    updateGravityData({ leftCost: Number(e.target.value) })
                  }
                  className="h-11 text-center text-lg"
                  min={0}
                />
              </Field>
              <Field className="w-32">
                <FieldLabel>Затраты П</FieldLabel>
                <Input
                  type="number"
                  value={visit.gravityData.rightCost || 0}
                  onChange={(e) =>
                    updateGravityData({ rightCost: Number(e.target.value) })
                  }
                  className="h-11 text-center text-lg"
                  min={0}
                />
              </Field>
              <Field className="w-32">
                <FieldLabel>Разница</FieldLabel>
                <div className={cn(
                  'h-11 flex items-center justify-center text-lg font-medium rounded-md',
                  Math.abs(visit.gravityData.weightLeft - visit.gravityData.weightRight) > 3
                    ? 'bg-warning/20 text-warning-foreground'
                    : 'bg-muted'
                )}>
                  {Math.abs(visit.gravityData.weightLeft - visit.gravityData.weightRight).toFixed(1)} кг
                </div>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
