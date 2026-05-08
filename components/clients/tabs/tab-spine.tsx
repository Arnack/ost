'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, RotateCcw, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'
import type { Visit, SpineSegment, SpineAnnotation } from '@/lib/types'

interface TabSpineProps {
  visit: Visit
  visits?: Visit[]
  onUpdate: (updates: Partial<Visit>) => void
  onDeleteVisit?: (visitId: string) => void
}

const spineSegments = [
  { id: 'C1', name: 'C1 (Атлант)', y: 7, x: 50 },
  { id: 'C2', name: 'C2 (Аксис)', y: 10, x: 50 },
  { id: 'C3', name: 'C3', y: 13, x: 50 },
  { id: 'C4', name: 'C4', y: 16, x: 50 },
  { id: 'C5', name: 'C5', y: 19, x: 50 },
  { id: 'C6', name: 'C6', y: 22, x: 50 },
  { id: 'C7', name: 'C7', y: 25, x: 50 },
  { id: 'T1', name: 'T1', y: 29, x: 50 },
  { id: 'T2', name: 'T2', y: 32, x: 50 },
  { id: 'T3', name: 'T3', y: 35, x: 50 },
  { id: 'T4', name: 'T4', y: 38, x: 50 },
  { id: 'T5', name: 'T5', y: 41, x: 50 },
  { id: 'T6', name: 'T6', y: 44, x: 50 },
  { id: 'T7', name: 'T7', y: 47, x: 50 },
  { id: 'T8', name: 'T8', y: 50, x: 50 },
  { id: 'T9', name: 'T9', y: 53, x: 50 },
  { id: 'T10', name: 'T10', y: 56, x: 50 },
  { id: 'T11', name: 'T11', y: 59, x: 50 },
  { id: 'T12', name: 'T12', y: 62, x: 50 },
  { id: 'L1', name: 'L1', y: 67, x: 50 },
  { id: 'L2', name: 'L2', y: 71, x: 50 },
  { id: 'L3', name: 'L3', y: 75, x: 50 },
  { id: 'L4', name: 'L4', y: 79, x: 50 },
  { id: 'L5', name: 'L5', y: 83, x: 50 },
  { id: 'S1', name: 'S1', y: 89, x: 50 },
  { id: 'S2', name: 'S2', y: 93, x: 50 },
]

const sideSpineHotspots = spineSegments.map((segment) => ({
  ...segment,
  x: segment.id.startsWith('C')
    ? 43
    : segment.id.startsWith('T')
      ? 36
      : segment.id.startsWith('L')
        ? 45
        : 42,
}))

const statusColors = {
  normal: 'bg-success',
  restricted: 'bg-warning',
  hypermobile: 'bg-chart-2',
  blocked: 'bg-destructive',
}

const statusLabels = {
  normal: 'Норма',
  restricted: 'Не в оси',
  hypermobile: 'Гипермобильность',
  blocked: 'Блок',
}

type DrawingTool = 'pencil' | 'eraser' | null

export function TabSpine({ visit, visits = [visit], onUpdate, onDeleteVisit }: TabSpineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [tool, setTool] = useState<DrawingTool>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawColor, setDrawColor] = useState('#ef4444')
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])

  // Get segment status
  const getSegmentStatus = (segmentId: string): SpineSegment['status'] => {
    const segment = visit.spineData.segments.find((s) => s.id === segmentId)
    return segment?.status || 'normal'
  }

  const toggleSegmentStatus = (segmentId: string) => {
    const currentSegments = [...visit.spineData.segments]
    const existingIndex = currentSegments.findIndex((s) => s.id === segmentId)

    if (existingIndex >= 0) {
      const currentStatus = currentSegments[existingIndex].status
      if (currentStatus === 'restricted') {
        currentSegments.splice(existingIndex, 1)
      } else {
        currentSegments[existingIndex] = {
          ...currentSegments[existingIndex],
          status: 'restricted',
        }
      }
    } else {
      currentSegments.push({
        id: segmentId,
        name: spineSegments.find((s) => s.id === segmentId)?.name || segmentId,
        status: 'restricted',
      })
    }

    onUpdate({
      spineData: {
        ...visit.spineData,
        segments: currentSegments,
      },
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrapper = wrapperRef.current
    if (!canvas || !wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const ratio = window.devicePixelRatio || 1
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!canvas) return
    if (!ctx) return

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    visit.spineData.annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color
      ctx.lineWidth = 3

      if (annotation.type === 'freehand' && annotation.points) {
        ctx.beginPath()
        annotation.points.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y)
          } else {
            ctx.lineTo(point.x, point.y)
          }
        })
        ctx.stroke()
      }
    })
  }, [visit.spineData.annotations])

  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const handleCanvasStart = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tool) return

    const point = getCanvasPoint(e)
    if (!point) return

    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    setCurrentPath([point])
  }

  const handleCanvasMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !tool) return

    const point = getCanvasPoint(e)
    const canvas = canvasRef.current
    if (!point || !canvas) return

    if (tool === 'pencil') {
      setCurrentPath((prev) => [...prev, point])

      const ctx = canvas.getContext('2d')
      if (ctx && currentPath.length > 0) {
        ctx.strokeStyle = drawColor
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y)
        ctx.lineTo(point.x, point.y)
        ctx.stroke()
      }
    }
  }

  const handleCanvasEnd = () => {
    if (!isDrawing || !tool || currentPath.length === 0) {
      setIsDrawing(false)
      return
    }

    const newAnnotation: SpineAnnotation = {
      id: crypto.randomUUID(),
      x: currentPath[0].x,
      y: currentPath[0].y,
      width: currentPath[currentPath.length - 1].x - currentPath[0].x,
      height: currentPath[currentPath.length - 1].y - currentPath[0].y,
      color: drawColor,
      type: 'freehand',
      points: currentPath,
    }

    onUpdate({
      spineData: {
        ...visit.spineData,
        annotations: [...visit.spineData.annotations, newAnnotation],
      },
    })

    setIsDrawing(false)
    setCurrentPath([])
  }

  const clearAnnotations = () => {
    onUpdate({
      spineData: {
        ...visit.spineData,
        annotations: [],
      },
    })

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        const rect = canvas.getBoundingClientRect()
        ctx.clearRect(0, 0, rect.width, rect.height)
      }
    }
  }

  const affectedSegments = visit.spineData.segments.filter((s) => s.status !== 'normal')
  const sortedVisits = [...visits].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const currentVisitDate = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(visit.date))

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Осмотр позвоночника</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Приём от {currentVisitDate}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Toggle
                  pressed={tool === 'pencil'}
                  onPressedChange={(pressed) => setTool(pressed ? 'pencil' : null)}
                  size="sm"
                >
                  <Pencil className="h-4 w-4" />
                </Toggle>
                <Button variant="ghost" size="sm" onClick={clearAnnotations}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted/30 rounded-lg p-4">
                <div className="flex gap-2 mb-4">
                  {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'].map((color) => (
                    <button
                      key={color}
                      className={cn(
                        'w-6 h-6 rounded-full border-2',
                        drawColor === color ? 'border-foreground' : 'border-transparent'
                      )}
                      style={{ backgroundColor: color }}
                      onClick={() => setDrawColor(color)}
                      aria-label={`Цвет ${color}`}
                    />
                  ))}
                </div>

                <div
                  ref={wrapperRef}
                  className="relative mx-auto grid max-w-4xl grid-cols-1 gap-4 md:grid-cols-2"
                >
                  <div className="rounded-lg bg-background/80 p-3">
                    <p className="mb-2 text-center text-sm font-medium">Вид спереди</p>
                    <div className="relative h-[560px]">
                      <img
                        src="/spine_front_view.svg"
                        alt="Позвоночник спереди"
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
                        {spineSegments.map((segment) => {
                          const status = getSegmentStatus(segment.id)
                          const isAffected = status !== 'normal'
                          return (
                            <g key={segment.id} onClick={() => toggleSegmentStatus(segment.id)} className="cursor-pointer">
                              <rect
                                x={segment.x - 6}
                                y={segment.y - 1.5}
                                width="12"
                                height="3"
                                rx="1"
                                className={cn(
                                  'stroke-background stroke-[0.35] transition-colors',
                                  isAffected ? 'fill-warning/90' : 'fill-transparent'
                                )}
                              />
                              <circle
                                cx={segment.x}
                                cy={segment.y}
                                r="4"
                                className={cn('fill-transparent', isAffected && 'fill-destructive/20')}
                              />
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-lg bg-background/80 p-3">
                    <p className="mb-2 text-center text-sm font-medium">Вид сбоку</p>
                    <div className="relative h-[560px]">
                      <img
                        src="/spine_side_view.svg"
                        alt="Позвоночник сбоку"
                        className="h-full w-full object-contain"
                        draggable={false}
                      />
                      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid meet">
                        {sideSpineHotspots.map((segment) => {
                          const status = getSegmentStatus(segment.id)
                          const isAffected = status !== 'normal'
                          return (
                            <g key={segment.id} onClick={() => toggleSegmentStatus(segment.id)} className="cursor-pointer">
                              <circle
                                cx={segment.x}
                                cy={segment.y}
                                r="3.4"
                                className={cn(
                                  'stroke-background stroke-[0.35] transition-colors',
                                  isAffected ? 'fill-destructive/85' : 'fill-transparent'
                                )}
                              />
                              <text x="62" y={segment.y + 1} className="text-[3px] fill-muted-foreground">
                                {segment.id}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  </div>

                  <canvas
                    ref={canvasRef}
                    className={cn(
                      'absolute inset-0 touch-none',
                      tool ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
                    )}
                    onPointerDown={handleCanvasStart}
                    onPointerMove={handleCanvasMove}
                    onPointerUp={handleCanvasEnd}
                    onPointerCancel={handleCanvasEnd}
                    onPointerLeave={handleCanvasEnd}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Состояние сегментов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-6 p-3 bg-muted/30 rounded-lg">
                {(['normal', 'restricted'] as const).map((status) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', statusColors[status])} />
                    <span className="text-sm">{statusLabels[status]}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Позвонки не в оси:
                </h4>
                {affectedSegments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Нажмите на позвонок на схеме
                  </p>
                ) : (
                  affectedSegments.map((segment) => (
                    <div
                      key={segment.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('w-3 h-3 rounded-full', statusColors[segment.status])} />
                        <span className="font-medium">{segment.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {statusLabels[segment.status]}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>История приёмов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedVisits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Нет приёмов
                  </p>
                ) : (
                  sortedVisits.map((item, idx) => {
                    const date = new Intl.DateTimeFormat('ru-RU', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                    }).format(new Date(item.date))
                    const count = item.spineData.segments.filter((s) => s.status !== 'normal').length
                    const isCurrentVisit = item.id === visit.id

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'rounded-lg border p-3 transition-colors',
                          isCurrentVisit && 'border-primary bg-primary/5'
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {/* Visit number badge */}
                            <span className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                              isCurrentVisit
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                            )}>
                              {sortedVisits.length - idx}
                            </span>
                            <div>
                              <span className="font-medium text-sm">
                                Приём {sortedVisits.length - idx}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground">{date}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{count} сегм.</span>
                            {onDeleteVisit && !isCurrentVisit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => onDeleteVisit(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {item.spineData.segments
                            .filter((s) => s.status !== 'normal')
                            .slice(0, 8)
                            .map((segment) => (
                              <span key={segment.id} className="rounded bg-warning/20 px-2 py-0.5 text-xs">
                                {segment.id}
                              </span>
                            ))}
                          {item.spineData.segments.filter((s) => s.status !== 'normal').length === 0 && (
                            <span className="text-xs text-muted-foreground italic">Норма</span>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Справочные проекции</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border bg-muted/20 p-2">
                <img
                  src="/skeleton-anatomy.png"
                  alt="Справочные изображения скелета: спереди, сзади, сбоку, 3/4"
                  className="w-full rounded object-contain"
                  draggable={false}
                />
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
