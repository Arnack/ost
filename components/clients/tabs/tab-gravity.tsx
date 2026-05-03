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

export function TabGravity({ visit, onUpdate }: TabGravityProps) {
  const updateGravityData = (updates: Partial<GravityData>) => {
    onUpdate({
      gravityData: {
        ...visit.gravityData,
        ...updates,
      },
    })
  }

  // 2x2 Grid selector component
  const GridSelector = ({
    title,
    data,
    onChange,
  }: {
    title: string
    data: { upper: GridValue; lower: GridValue }
    onChange: (updates: { upper?: GridValue; lower?: GridValue }) => void
  }) => {
    const cycleValue = (current: GridValue): GridValue => {
      const values: GridValue[] = ['neutral', '+', '-']
      const index = values.indexOf(current)
      return values[(index + 1) % values.length]
    }

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-center">{title}</p>
        <div className="grid grid-cols-2 gap-1 w-32 mx-auto">
          {/* Upper Left */}
          <button
            type="button"
            onClick={() => onChange({ upper: cycleValue(data.upper) })}
            className={cn(
              'h-12 rounded-tl-lg border-2 flex items-center justify-center text-lg font-bold transition-colors',
              data.upper === '+' && 'bg-success/20 border-success text-success',
              data.upper === '-' && 'bg-destructive/20 border-destructive text-destructive',
              data.upper === 'neutral' && 'bg-muted border-border text-muted-foreground'
            )}
          >
            {data.upper === 'neutral' ? '○' : data.upper}
          </button>
          {/* Upper Right */}
          <button
            type="button"
            onClick={() => onChange({ upper: cycleValue(data.upper) })}
            className={cn(
              'h-12 rounded-tr-lg border-2 flex items-center justify-center text-lg font-bold transition-colors',
              data.upper === '+' && 'bg-success/20 border-success text-success',
              data.upper === '-' && 'bg-destructive/20 border-destructive text-destructive',
              data.upper === 'neutral' && 'bg-muted border-border text-muted-foreground'
            )}
          >
            {data.upper === 'neutral' ? '○' : data.upper}
          </button>
          {/* Lower Left */}
          <button
            type="button"
            onClick={() => onChange({ lower: cycleValue(data.lower) })}
            className={cn(
              'h-12 rounded-bl-lg border-2 flex items-center justify-center text-lg font-bold transition-colors',
              data.lower === '+' && 'bg-success/20 border-success text-success',
              data.lower === '-' && 'bg-destructive/20 border-destructive text-destructive',
              data.lower === 'neutral' && 'bg-muted border-border text-muted-foreground'
            )}
          >
            {data.lower === 'neutral' ? '○' : data.lower}
          </button>
          {/* Lower Right */}
          <button
            type="button"
            onClick={() => onChange({ lower: cycleValue(data.lower) })}
            className={cn(
              'h-12 rounded-br-lg border-2 flex items-center justify-center text-lg font-bold transition-colors',
              data.lower === '+' && 'bg-success/20 border-success text-success',
              data.lower === '-' && 'bg-destructive/20 border-destructive text-destructive',
              data.lower === 'neutral' && 'bg-muted border-border text-muted-foreground'
            )}
          >
            {data.lower === 'neutral' ? '○' : data.lower}
          </button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Нажмите для переключения: ○ → + → −
        </p>
      </div>
    )
  }

  // Foot diagram component
  const FootDiagram = ({
    side,
    data,
    onChange,
  }: {
    side: 'left' | 'right'
    data: { front: number; back: number; inner: number; outer: number }
    onChange: (updates: Partial<typeof data>) => void
  }) => {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-center">
          {side === 'left' ? 'Левая стопа' : 'Правая стопа'}
        </p>
        <div className="relative w-24 h-40 mx-auto">
          {/* Foot outline SVG */}
          <svg viewBox="0 0 60 100" className="w-full h-full">
            {/* Simplified foot shape */}
            <ellipse cx="30" cy="25" rx="20" ry="25" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
            <ellipse cx="30" cy="70" rx="25" ry="30" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
          </svg>
          
          {/* Input fields positioned around foot */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2">
            <Input
              type="number"
              value={data.front}
              onChange={(e) => onChange({ front: Number(e.target.value) })}
              className="w-12 h-7 text-xs text-center p-0"
              min={0}
              max={100}
            />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-2">
            <Input
              type="number"
              value={data.back}
              onChange={(e) => onChange({ back: Number(e.target.value) })}
              className="w-12 h-7 text-xs text-center p-0"
              min={0}
              max={100}
            />
          </div>
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2',
            side === 'left' ? 'right-full mr-1' : 'left-full ml-1'
          )}>
            <Input
              type="number"
              value={data.outer}
              onChange={(e) => onChange({ outer: Number(e.target.value) })}
              className="w-12 h-7 text-xs text-center p-0"
              min={0}
              max={100}
            />
          </div>
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2',
            side === 'left' ? 'left-full ml-1' : 'right-full mr-1'
          )}>
            <Input
              type="number"
              value={data.inner}
              onChange={(e) => onChange({ inner: Number(e.target.value) })}
              className="w-12 h-7 text-xs text-center p-0"
              min={0}
              max={100}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">% распределения веса</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Centers of gravity grids */}
        <Card>
          <CardHeader>
            <CardTitle>Центры тяжести</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-12">
              <GridSelector
                title="Передне-задний"
                data={visit.gravityData.anteriorPosterior}
                onChange={(updates) =>
                  updateGravityData({
                    anteriorPosterior: {
                      ...visit.gravityData.anteriorPosterior,
                      ...updates,
                    },
                  })
                }
              />
              <GridSelector
                title="Лево-правый"
                data={visit.gravityData.leftRight}
                onChange={(updates) =>
                  updateGravityData({
                    leftRight: {
                      ...visit.gravityData.leftRight,
                      ...updates,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Foot diagrams */}
        <Card>
          <CardHeader>
            <CardTitle>Распределение веса на стопах</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-16">
              <FootDiagram
                side="left"
                data={visit.gravityData.footLeft}
                onChange={(updates) =>
                  updateGravityData({
                    footLeft: {
                      ...visit.gravityData.footLeft,
                      ...updates,
                    },
                  })
                }
              />
              <FootDiagram
                side="right"
                data={visit.gravityData.footRight}
                onChange={(updates) =>
                  updateGravityData({
                    footRight: {
                      ...visit.gravityData.footRight,
                      ...updates,
                    },
                  })
                }
              />
            </div>
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
