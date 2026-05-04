'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Visit, MuscleChain } from '@/lib/types'

interface TabMuscleChainsProps {
  visit: Visit
  onUpdate: (updates: Partial<Visit>) => void
}

const muscleChainDefinitions = [
  {
    id: 'superficial',
    name: 'Поверхностная цепь',
    description: 'Передняя и задняя поверхностные связи',
    color: 'bg-chart-1',
    group: 'superficial' as const,
  },
  {
    id: 'deep',
    name: 'Глубинная цепь',
    description: 'Внутренний стержень и глубокие стабилизаторы',
    color: 'bg-chart-2',
    group: 'deep' as const,
  },
  {
    id: 'lateral',
    name: 'Латеральная цепь',
    description: 'Боковые линии слева и справа',
    color: 'bg-chart-3',
    group: 'lateral' as const,
  },
  {
    id: 'spiral',
    name: 'Спиральная цепь',
    description: 'Диагональные и ротационные связи',
    color: 'bg-chart-4',
    group: 'spiral' as const,
  },
]

export function TabMuscleChains({ visit, onUpdate }: TabMuscleChainsProps) {
  // Get chain status
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

    onUpdate({
      muscleChains: {
        chains: currentChains,
      },
    })
  }

  // Get break chains
  const brokenChains = visit.muscleChains.chains.filter((c) => c.status === 'break')

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Миофасциальные цепи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {muscleChainDefinitions.map((chain) => {
                const status = getChainStatus(chain.id)
                const isBreak = status === 'break'

                return (
                  <div
                    key={chain.id}
                    className={cn(
                      'relative p-4 rounded-lg border-2 text-left transition-all min-h-[100px]',
                      isBreak
                        ? 'border-destructive bg-destructive/10'
                        : 'border-border bg-card hover:border-primary/50'
                    )}
                  >
                    <div className="flex items-start gap-3 pr-20">
                      <div className={cn('w-3 h-3 rounded-full mt-1 shrink-0', chain.color)} />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm leading-tight">{chain.name}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {chain.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {[
                        ['leftStatus', 'Левая'],
                        ['rightStatus', 'Правая'],
                      ].map(([side, label]) => {
                        const sideStatus = getChainSideStatus(
                          chain.id,
                          side as 'leftStatus' | 'rightStatus'
                        )
                        return (
                          <button
                            key={side}
                            type="button"
                            onClick={() =>
                              toggleChain(
                                chain.id,
                                chain.name,
                                side as 'leftStatus' | 'rightStatus'
                              )
                            }
                            className={cn(
                              'rounded-md border px-2 py-1 text-xs font-medium',
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
                    <div className={cn(
                      'absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium',
                      isBreak
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-success/20 text-success'
                    )}>
                      {isBreak ? 'РАЗРЫВ' : 'НОРМА'}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-success/20 text-success text-xs font-medium">
                  НОРМА
                </div>
                <span className="text-sm">Цепь функционирует</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-medium">
                  РАЗРЫВ
                </div>
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
                        <p className="text-sm text-muted-foreground">
                          {definition?.description}
                        </p>
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

        {/* Visual diagram placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Схема цепей</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-8 text-center">
              <svg viewBox="0 0 200 300" className="w-full max-w-[200px] mx-auto">
                {/* Simplified body outline */}
                <ellipse cx="100" cy="30" rx="25" ry="25" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
                <line x1="100" y1="55" x2="100" y2="180" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
                <line x1="100" y1="80" x2="40" y2="140" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
                <line x1="100" y1="80" x2="160" y2="140" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
                <line x1="85" y1="180" x2="70" y2="280" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />
                <line x1="115" y1="180" x2="130" y2="280" stroke="currentColor" strokeWidth="1" className="text-muted-foreground" />

                {/* Chain indicators */}
                {muscleChainDefinitions.slice(0, 4).map((chain, index) => {
                  const status = getChainStatus(chain.id)
                  const y = 70 + index * 40
                  return (
                    <g key={chain.id}>
                      <line
                        x1="50"
                        y1={y}
                        x2="150"
                        y2={y}
                        strokeWidth="3"
                        className={cn(
                          status === 'break' ? 'stroke-destructive' : 'stroke-muted-foreground/30'
                        )}
                        strokeDasharray={status === 'break' ? '5,5' : 'none'}
                      />
                    </g>
                  )
                })}
              </svg>
              <p className="text-sm text-muted-foreground mt-4">
                Красные пунктирные линии показывают нарушенные цепи
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
