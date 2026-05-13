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
  { id: 'C1', name: 'C1 (Атлант)', front: { x: 340, y: 35.5, width: 108, height: 11 }, side: { x: 286, y: 35, width: 72, height: 10 } },
  { id: 'C2', name: 'C2 (Аксис)', front: { x: 340, y: 55.5, width: 100, height: 17 }, side: { x: 282, y: 56, width: 68, height: 18 } },
  { id: 'C3', name: 'C3', front: { x: 340, y: 78.5, width: 96, height: 17 }, side: { x: 279, y: 80.5, width: 66, height: 17 } },
  { id: 'C4', name: 'C4', front: { x: 340, y: 101.5, width: 96, height: 17 }, side: { x: 277, y: 103.5, width: 66, height: 17 } },
  { id: 'C5', name: 'C5', front: { x: 340, y: 124.5, width: 96, height: 17 }, side: { x: 275, y: 126.5, width: 66, height: 17 } },
  { id: 'C6', name: 'C6', front: { x: 340, y: 147.5, width: 96, height: 17 }, side: { x: 273, y: 149.5, width: 66, height: 17 } },
  { id: 'C7', name: 'C7', front: { x: 340, y: 171, width: 98, height: 18 }, side: { x: 272, y: 173, width: 68, height: 18 } },
  { id: 'T1', name: 'T1', front: { x: 340, y: 196.5, width: 100, height: 19 }, side: { x: 269, y: 199, width: 70, height: 20 } },
  { id: 'T2', name: 'T2', front: { x: 340, y: 222.5, width: 102, height: 19 }, side: { x: 265, y: 226, width: 70, height: 20 } },
  { id: 'T3', name: 'T3', front: { x: 340, y: 248.5, width: 104, height: 19 }, side: { x: 261, y: 253, width: 70, height: 20 } },
  { id: 'T4', name: 'T4', front: { x: 340, y: 275, width: 106, height: 20 }, side: { x: 257, y: 280, width: 70, height: 20 } },
  { id: 'T5', name: 'T5', front: { x: 340, y: 302, width: 108, height: 20 }, side: { x: 255, y: 307, width: 70, height: 20 } },
  { id: 'T6', name: 'T6', front: { x: 340, y: 329, width: 108, height: 20 }, side: { x: 255, y: 334, width: 70, height: 20 } },
  { id: 'T7', name: 'T7', front: { x: 340, y: 356, width: 108, height: 20 }, side: { x: 255, y: 361, width: 70, height: 20 } },
  { id: 'T8', name: 'T8', front: { x: 340, y: 383.5, width: 110, height: 21 }, side: { x: 257, y: 388.5, width: 70, height: 21 } },
  { id: 'T9', name: 'T9', front: { x: 340, y: 412.5, width: 112, height: 21 }, side: { x: 259, y: 416.5, width: 70, height: 21 } },
  { id: 'T10', name: 'T10', front: { x: 340, y: 441.5, width: 114, height: 21 }, side: { x: 263, y: 444.5, width: 70, height: 21 } },
  { id: 'T11', name: 'T11', front: { x: 340, y: 471, width: 116, height: 22 }, side: { x: 267, y: 473.5, width: 70, height: 21 } },
  { id: 'T12', name: 'T12', front: { x: 340, y: 501, width: 118, height: 22 }, side: { x: 272, y: 503, width: 72, height: 22 } },
  { id: 'L1', name: 'L1', front: { x: 340, y: 532.5, width: 120, height: 25 }, side: { x: 279, y: 534, width: 78, height: 24 } },
  { id: 'L2', name: 'L2', front: { x: 340, y: 567, width: 124, height: 26 }, side: { x: 284, y: 567.5, width: 80, height: 25 } },
  { id: 'L3', name: 'L3', front: { x: 340, y: 602.5, width: 128, height: 27 }, side: { x: 289, y: 602, width: 82, height: 26 } },
  { id: 'L4', name: 'L4', front: { x: 340, y: 638.5, width: 130, height: 27 }, side: { x: 288, y: 637, width: 84, height: 26 } },
  { id: 'L5', name: 'L5', front: { x: 340, y: 676, width: 132, height: 28 }, side: { x: 285, y: 672, width: 86, height: 26 } },
  { id: 'S1', name: 'S1', front: { x: 340, y: 706, width: 148, height: 16 }, side: { x: 282, y: 710, width: 86, height: 16 } },
  { id: 'S2', name: 'S2', front: { x: 340, y: 722, width: 108, height: 16 }, side: { x: 280, y: 726, width: 54, height: 16 } },
]

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

export function TabSpine({ visit, visits = [visit], onUpdate }: TabSpineProps) {
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
  const savedSnapshots = [...(visit.spineHistory || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  const sortedPreviousVisits = [...visits]
    .filter((item) => item.id !== visit.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  const currentVisitDate = new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(visit.date))

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">
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
                    <div className="relative h-[700px]">
                      <svg viewBox="170 0 340 782" className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Позвоночник спереди">
                        <image href="/spine_front_view.svg" x="0" y="0" width="680" height="782" />
                        {spineSegments.map((segment, index) => {
                          const status = getSegmentStatus(segment.id)
                          const isAffected = status !== 'normal'
                          const hotspot = segment.front
                          const labelX = index % 2 === 0 ? 204 : 434
                          return (
                            <g key={segment.id} onClick={() => toggleSegmentStatus(segment.id)} className="cursor-pointer">
                              <rect
                                x={hotspot.x - hotspot.width / 2}
                                y={hotspot.y - hotspot.height / 2}
                                width={hotspot.width}
                                height={hotspot.height}
                                rx="5"
                                className={cn(
                                  'stroke-background stroke-[2] transition-colors',
                                  isAffected ? 'fill-warning/90' : 'fill-transparent'
                                )}
                              />
                              <circle
                                cx={hotspot.x}
                                cy={hotspot.y}
                                r="18"
                                className={cn('fill-transparent transition-colors', isAffected && 'fill-destructive/20')}
                              />
                              <rect
                                x={labelX}
                                y={hotspot.y - 13}
                                width="42"
                                height="26"
                                rx="7"
                                className={cn(
                                  'fill-background/95 stroke-foreground stroke-[1.5] transition-colors',
                                  isAffected && 'fill-destructive stroke-destructive'
                                )}
                              />
                              <text
                                x={labelX + 21}
                                y={hotspot.y + 5}
                                textAnchor="middle"
                                className={cn(
                                  'select-none text-[15px] font-bold fill-foreground transition-colors',
                                  isAffected && 'fill-destructive-foreground'
                                )}
                              >
                                {segment.id}
                              </text>
                            </g>
                          )
                        })}
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-lg bg-background/80 p-3">
                    <p className="mb-2 text-center text-sm font-medium">Вид сбоку</p>
                    <div className="relative h-[700px]">
                      <svg viewBox="150 0 340 784" className="h-full w-full" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Позвоночник сбоку">
                        <image href="/spine_side_view.svg" x="0" y="0" width="680" height="784" />
                        {spineSegments.map((segment) => {
                          const status = getSegmentStatus(segment.id)
                          const isAffected = status !== 'normal'
                          const hotspot = segment.side
                          const labelX = 392
                          return (
                            <g key={segment.id} onClick={() => toggleSegmentStatus(segment.id)} className="cursor-pointer">
                              <rect
                                x={hotspot.x - hotspot.width / 2}
                                y={hotspot.y - hotspot.height / 2}
                                width={hotspot.width}
                                height={hotspot.height}
                                rx="6"
                                className={cn(
                                  'stroke-background stroke-[2] transition-colors',
                                  isAffected ? 'fill-warning/90' : 'fill-transparent'
                                )}
                              />
                              <circle
                                cx={hotspot.x}
                                cy={hotspot.y}
                                r="18"
                                className={cn('fill-transparent transition-colors', isAffected && 'fill-destructive/20')}
                              />
                              <rect
                                x={labelX}
                                y={hotspot.y - 13}
                                width="42"
                                height="26"
                                rx="7"
                                className={cn(
                                  'fill-background/95 stroke-foreground stroke-[1.5] transition-colors',
                                  isAffected && 'fill-destructive stroke-destructive'
                                )}
                              />
                              <text
                                x={labelX + 21}
                                y={hotspot.y + 5}
                                textAnchor="middle"
                                className={cn(
                                  'select-none text-[15px] font-bold fill-foreground transition-colors',
                                  isAffected && 'fill-destructive-foreground'
                                )}
                              >
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

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {savedSnapshots.length === 0 && sortedPreviousVisits.length === 0 ? (
                    <div className="rounded-lg border border-dashed bg-background/60 p-4 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-5">
                      Нет предыдущих отметок
                    </div>
                  ) : (
                    [
                      ...savedSnapshots.map((snapshot, index) => ({
                        id: snapshot.id,
                        date: snapshot.date,
                        title: new Intl.DateTimeFormat('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(snapshot.date)),
                        spineData: snapshot.spineData,
                        type: 'snapshot' as const,
                      })),
                      ...sortedPreviousVisits.map((item, index) => ({
                        id: item.id,
                        date: item.date,
                        title: `Приём ${sortedPreviousVisits.length - index}`,
                        spineData: item.spineData,
                        type: 'visit' as const,
                      })),
                    ].slice(0, 5).map((item) => {
                      const markedSegments = item.spineData.segments.filter((s) => s.status !== 'normal')

                      return (
                        <div key={item.id} className="min-h-24 rounded-lg border bg-background/80 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">{item.title}</span>
                            {item.type === 'snapshot' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() =>
                                  onUpdate({
                                    spineHistory: (visit.spineHistory || []).filter((snapshot) => snapshot.id !== item.id),
                                  })
                                }
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {markedSegments.length === 0 ? (
                              <span className="text-xs italic text-muted-foreground">Норма</span>
                            ) : (
                              markedSegments.slice(0, 10).map((segment) => (
                                <span key={segment.id} className="rounded bg-warning/20 px-2 py-0.5 text-xs">
                                  {segment.id}
                                </span>
                              ))
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
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

          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
