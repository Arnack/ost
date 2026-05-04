'use client'

import { useState, useRef, useEffect } from 'react'
import { Pencil, Eraser, RotateCcw, Circle, Minus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Toggle } from '@/components/ui/toggle'
import { cn } from '@/lib/utils'
import type { Visit, SpineSegment, SpineAnnotation } from '@/lib/types'

interface TabSpineProps {
  visit: Visit
  onUpdate: (updates: Partial<Visit>) => void
}

const spineSegments = [
  { id: 'C0', name: 'C0 (Затылок)', y: 5 },
  { id: 'C1', name: 'C1 (Атлант)', y: 8 },
  { id: 'C2', name: 'C2 (Аксис)', y: 11 },
  { id: 'C3', name: 'C3', y: 14 },
  { id: 'C4', name: 'C4', y: 17 },
  { id: 'C5', name: 'C5', y: 20 },
  { id: 'C6', name: 'C6', y: 23 },
  { id: 'C7', name: 'C7', y: 26 },
  { id: 'T1', name: 'T1', y: 30 },
  { id: 'T2', name: 'T2', y: 33 },
  { id: 'T3', name: 'T3', y: 36 },
  { id: 'T4', name: 'T4', y: 39 },
  { id: 'T5', name: 'T5', y: 42 },
  { id: 'T6', name: 'T6', y: 45 },
  { id: 'T7', name: 'T7', y: 48 },
  { id: 'T8', name: 'T8', y: 51 },
  { id: 'T9', name: 'T9', y: 54 },
  { id: 'T10', name: 'T10', y: 57 },
  { id: 'T11', name: 'T11', y: 60 },
  { id: 'T12', name: 'T12', y: 63 },
  { id: 'L1', name: 'L1', y: 68 },
  { id: 'L2', name: 'L2', y: 72 },
  { id: 'L3', name: 'L3', y: 76 },
  { id: 'L4', name: 'L4', y: 80 },
  { id: 'L5', name: 'L5', y: 84 },
  { id: 'S1', name: 'S1', y: 89 },
  { id: 'S2', name: 'S2', y: 92 },
  { id: 'Coccyx', name: 'Копчик', y: 96 },
]

const statusColors = {
  normal: 'bg-success',
  restricted: 'bg-warning',
  hypermobile: 'bg-chart-2',
  blocked: 'bg-destructive',
}

const statusLabels = {
  normal: 'Норма',
  restricted: 'Ограничение',
  hypermobile: 'Гипермобильность',
  blocked: 'Блок',
}

type DrawingTool = 'pencil' | 'circle' | 'line' | 'eraser' | null

export function TabSpine({ visit, onUpdate }: TabSpineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<DrawingTool>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [drawColor, setDrawColor] = useState('#ef4444')
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([])

  // Get segment status
  const getSegmentStatus = (segmentId: string): SpineSegment['status'] => {
    const segment = visit.spineData.segments.find((s) => s.id === segmentId)
    return segment?.status || 'normal'
  }

  // Toggle segment status
  const toggleSegmentStatus = (segmentId: string) => {
    const currentSegments = [...visit.spineData.segments]
    const existingIndex = currentSegments.findIndex((s) => s.id === segmentId)
    const statuses: SpineSegment['status'][] = ['normal', 'restricted', 'hypermobile', 'blocked']

    if (existingIndex >= 0) {
      const currentStatus = currentSegments[existingIndex].status
      const nextIndex = (statuses.indexOf(currentStatus) + 1) % statuses.length
      currentSegments[existingIndex] = {
        ...currentSegments[existingIndex],
        status: statuses[nextIndex],
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

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear and redraw annotations
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    visit.spineData.annotations.forEach((annotation) => {
      ctx.strokeStyle = annotation.color
      ctx.lineWidth = 2

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
      } else if (annotation.type === 'circle') {
        ctx.beginPath()
        const radius = Math.sqrt(
          Math.pow(annotation.width, 2) + Math.pow(annotation.height, 2)
        ) / 2
        ctx.arc(annotation.x, annotation.y, radius, 0, 2 * Math.PI)
        ctx.stroke()
      } else if (annotation.type === 'line') {
        ctx.beginPath()
        ctx.moveTo(annotation.x, annotation.y)
        ctx.lineTo(annotation.x + annotation.width, annotation.y + annotation.height)
        ctx.stroke()
      }
    })
  }, [visit.spineData.annotations])

  // Handle canvas mouse/touch events
  const handleCanvasStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!tool || tool === 'eraser') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top

    setIsDrawing(true)
    setCurrentPath([{ x, y }])
  }

  const handleCanvasMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !tool) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top

    if (tool === 'pencil') {
      setCurrentPath((prev) => [...prev, { x, y }])

      // Draw current stroke
      const ctx = canvas.getContext('2d')
      if (ctx && currentPath.length > 0) {
        ctx.strokeStyle = drawColor
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(currentPath[currentPath.length - 1].x, currentPath[currentPath.length - 1].y)
        ctx.lineTo(x, y)
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
      type: tool === 'pencil' ? 'freehand' : tool === 'circle' ? 'circle' : 'line',
      points: tool === 'pencil' ? currentPath : undefined,
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

  // Clear all annotations
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
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Spine diagram with canvas overlay */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Схема позвоночника</CardTitle>
              <div className="flex items-center gap-1">
                <Toggle
                  pressed={tool === 'pencil'}
                  onPressedChange={(pressed) => setTool(pressed ? 'pencil' : null)}
                  size="sm"
                >
                  <Pencil className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={tool === 'circle'}
                  onPressedChange={(pressed) => setTool(pressed ? 'circle' : null)}
                  size="sm"
                >
                  <Circle className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={tool === 'line'}
                  onPressedChange={(pressed) => setTool(pressed ? 'line' : null)}
                  size="sm"
                >
                  <Minus className="h-4 w-4" />
                </Toggle>
                <Button variant="ghost" size="sm" onClick={clearAnnotations}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative bg-muted/30 rounded-lg p-4">
                {/* Color picker */}
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
                    />
                  ))}
                </div>

                {/* SVG Spine diagram */}
                <div className="relative mx-auto" style={{ width: '200px', height: '500px' }}>
                  <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Spine line */}
                    <line x1="50" y1="5" x2="50" y2="96" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
                    
                    {/* Segments */}
                    {spineSegments.map((segment) => {
                      const status = getSegmentStatus(segment.id)
                      return (
                        <g key={segment.id} onClick={() => toggleSegmentStatus(segment.id)} className="cursor-pointer">
                          <circle
                            cx="50"
                            cy={segment.y}
                            r="2.5"
                            className={cn(
                              'transition-colors',
                              status === 'normal' && 'fill-muted-foreground',
                              status === 'restricted' && 'fill-warning',
                              status === 'hypermobile' && 'fill-chart-2',
                              status === 'blocked' && 'fill-destructive'
                            )}
                          />
                          <text
                            x="60"
                            y={segment.y + 1}
                            className="text-[3px] fill-muted-foreground"
                          >
                            {segment.id}
                          </text>
                        </g>
                      )
                    })}
                  </svg>

                  {/* Canvas overlay for annotations */}
                  <canvas
                    ref={canvasRef}
                    width={200}
                    height={500}
                    className="absolute inset-0 touch-none"
                    onMouseDown={handleCanvasStart}
                    onMouseMove={handleCanvasMove}
                    onMouseUp={handleCanvasEnd}
                    onMouseLeave={handleCanvasEnd}
                    onTouchStart={handleCanvasStart}
                    onTouchMove={handleCanvasMove}
                    onTouchEnd={handleCanvasEnd}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segment status legend and list */}
          <Card>
            <CardHeader>
              <CardTitle>Состояние сегментов</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mb-6 p-3 bg-muted/30 rounded-lg">
                {Object.entries(statusLabels).map(([status, label]) => (
                  <div key={status} className="flex items-center gap-2">
                    <div className={cn('w-3 h-3 rounded-full', statusColors[status as keyof typeof statusColors])} />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </div>

              {/* Affected segments list */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  Отмеченные сегменты:
                </h4>
                {visit.spineData.segments.filter((s) => s.status !== 'normal').length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Нажмите на сегмент для изменения статуса
                  </p>
                ) : (
                  visit.spineData.segments
                    .filter((s) => s.status !== 'normal')
                    .map((segment) => (
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
    </ScrollArea>
  )
}
