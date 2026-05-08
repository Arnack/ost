'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Visit, MuscleChain } from '@/lib/types'

interface TabMuscleChainsProps {
  visit: Visit
  onUpdate: (updates: Partial<Visit>) => void
}

// The lines.png is 4 equal sections by width:
// 0-25%   → Поверхностная задняя цепь  (purple/back)
// 25-50%  → Поверхностная передняя цепь (blue/front)
// 50-75%  → Латеральная цепь            (green/lateral)
// 75-100% → Спиральная цепь             (orange/spiral)

const muscleChainDefinitions = [
  {
    id: 'superficial-back',
    name: 'Поверхностная задняя цепь',
    description: 'Задняя поверхность тела от стоп до черепа',
    color: 'bg-purple-500',
    accentColor: 'purple',
    clipPercent: '0% 75% 0% 0%',   // show left 25%
    imgOffset: '0%',
    group: 'superficial' as const,
  },
  {
    id: 'superficial-front',
    name: 'Поверхностная передняя цепь',
    description: 'Передняя поверхность тела от стоп до черепа',
    color: 'bg-blue-500',
    accentColor: 'blue',
    clipPercent: '0% 50% 0% 25%',  // 25-50%
    imgOffset: '-25%',
    group: 'superficial' as const,
  },
  {
    id: 'lateral',
    name: 'Латеральная цепь',
    description: 'Боковые линии слева и справа',
    color: 'bg-green-500',
    accentColor: 'green',
    clipPercent: '0% 25% 0% 50%',  // 50-75%
    imgOffset: '-50%',
    group: 'lateral' as const,
  },
  {
    id: 'spiral',
    name: 'Спиральная цепь',
    description: 'Диагональные и ротационные связи',
    color: 'bg-orange-500',
    accentColor: 'orange',
    clipPercent: '0% 0% 0% 75%',   // 75-100%
    imgOffset: '-75%',
    group: 'spiral' as const,
  },
]

export function TabMuscleChains({ visit, onUpdate }: TabMuscleChainsProps) {
  const getChainStatus = (chainId: string): MuscleChain['status'] => {
    const chain = visit.muscleChains.chains.find((c) => c.id === chainId)
    return chain?.status || 'norm'
  }

  const getChainSideStatus = (chainId: string, side: 'leftStatus' | 'rightStatus') => {
    const chain = visit.muscleChains.chains.find((c) => c.id === chainId)
    return chain?.[side] || chain?.status || 'norm'
  }

  const toggleChain = (chainId: string, chainName: string, side?: 'leftStatus' | 'rightStatus') => {
    const currentChains = [...visit.muscleChains.chains]
    const existingIndex = currentChains.findIndex((c) => c.id === chainId)
    const definition = muscleChainDefinitions.find((c) => c.id === chainId)

    if (existingIndex >= 0) {
      const currentStatus = side
        ? getChainSideStatus(chainId, side)
        : currentChains[existingIndex].status
      const nextStatus = currentStatus === 'norm' ? 'break' : 'norm'
      const nextLeftStatus = side === 'leftStatus'
        ? nextStatus
        : currentChains[existingIndex].leftStatus || currentChains[existingIndex].status
      const nextRightStatus = side === 'rightStatus'
        ? nextStatus
        : currentChains[existingIndex].rightStatus || currentChains[existingIndex].status
      currentChains[existingIndex] = {
        ...currentChains[existingIndex],
        ...(side ? { [side]: nextStatus } : { status: nextStatus }),
        status:
          side && (nextLeftStatus === 'break' || nextRightStatus === 'break')
            ? 'break'
            : side
              ? 'norm'
              : nextStatus,
      }
    } else {
      const nextStatus = 'break'
      currentChains.push({
        id: chainId,
        name: chainName,
        status: nextStatus,
        leftStatus: side === 'leftStatus' ? nextStatus : 'norm',
        rightStatus: side === 'rightStatus' ? nextStatus : 'norm',
        group: definition?.group,
      })
    }

    onUpdate({ muscleChains: { chains: currentChains } })
  }

  const brokenChains = visit.muscleChains.chains.filter((c) => c.status === 'break')

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">

        {/* Anatomical images from lines.png — 4 cropped sections */}
        <Card>
          <CardHeader>
            <CardTitle>Мышечные цепи — анатомические изображения</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {muscleChainDefinitions.map((chain) => {
                const status = getChainStatus(chain.id)
                const isBreak = status === 'break'
                const leftSt  = getChainSideStatus(chain.id, 'leftStatus')
                const rightSt = getChainSideStatus(chain.id, 'rightStatus')

                return (
                  <div
                    key={chain.id}
                    className={cn(
                      'rounded-xl border-2 overflow-hidden transition-all',
                      isBreak ? 'border-destructive' : 'border-border'
                    )}
                  >
                    {/* Cropped section of lines.png */}
                    <div className="relative w-full overflow-hidden bg-muted" style={{ paddingTop: '120%' }}>
                      <img
                        src="/lines.png"
                        alt={chain.name}
                        draggable={false}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: chain.imgOffset,
                          width: '400%',     // 4x wide so each section = 100%
                          height: '100%',
                          objectFit: 'cover',
                          objectPosition: 'top',
                        }}
                      />
                      {/* Break overlay */}
                      {isBreak && (
                        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                          <span className="text-destructive font-bold text-lg bg-white/80 px-2 py-0.5 rounded">
                            РАЗРЫВ
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Chain info + controls */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className={cn('w-2.5 h-2.5 rounded-full mt-1 shrink-0', chain.color)} />
                        <div>
                          <h4 className="font-semibold text-sm leading-tight">{chain.name}</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">{chain.description}</p>
                        </div>
                      </div>

                      {/* Left / Right toggle buttons */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['leftStatus', 'rightStatus'] as const).map((side) => {
                          const sideStatus = getChainSideStatus(chain.id, side)
                          const label = side === 'leftStatus' ? 'Лев' : 'Пра'
                          return (
                            <button
                              key={side}
                              type="button"
                              onClick={() => toggleChain(chain.id, chain.name, side)}
                              className={cn(
                                'rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors',
                                sideStatus === 'break'
                                  ? 'border-destructive bg-destructive/10 text-destructive'
                                  : 'border-success/30 bg-success/10 text-success'
                              )}
                            >
                              {label}: {sideStatus === 'break' ? 'разрыв' : 'норма'}
                            </button>
                          )
                        })}
                      </div>

                      {/* Overall badge */}
                      <div className={cn(
                        'text-center py-1 rounded text-xs font-bold',
                        isBreak
                          ? 'bg-destructive text-destructive-foreground'
                          : 'bg-success/20 text-success'
                      )}>
                        {isBreak ? '⚠ РАЗРЫВ' : '✓ НОРМА'}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-success/20 text-success text-xs font-medium">✓ НОРМА</div>
                <span className="text-sm">Цепь функционирует</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-medium">⚠ РАЗРЫВ</div>
                <span className="text-sm">Нарушение в цепи</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary of broken chains */}
        {brokenChains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Нарушенные цепи ({brokenChains.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {brokenChains.map((chain) => {
                  const definition = muscleChainDefinitions.find((d) => d.id === chain.id)
                  return (
                    <div
                      key={chain.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                    >
                      <div className={cn('w-3 h-3 rounded-full shrink-0', definition?.color)} />
                      <div className="flex-1">
                        <p className="font-medium">{chain.name}</p>
                        <p className="text-sm text-muted-foreground">{definition?.description}</p>
                      </div>
                      <span className="text-xs font-medium text-destructive bg-destructive/20 px-2 py-1 rounded">
                        РАЗРЫВ
                      </span>
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
