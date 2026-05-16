'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Visit, MuscleChain } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

interface TabMuscleChainsProps {
  visit: Visit
  allVisits?: Visit[]
  onUpdate: (updates: Partial<Visit>) => void
}

const muscleChainDefinitions = [
  {
    id: 'superficial-back',
    name: 'Поверхностная задняя цепь',
    description: 'Задняя поверхность тела от стоп до черепа',
    color: 'bg-purple-500',
    accentColor: 'purple',
    image: '/line1.png',
    group: 'superficial' as const,
  },
  {
    id: 'superficial-front',
    name: 'Поверхностная передняя цепь',
    description: 'Передняя поверхность тела от стоп до черепа',
    color: 'bg-blue-500',
    accentColor: 'blue',
    image: '/line2.png',
    group: 'superficial' as const,
  },
  {
    id: 'lateral',
    name: 'Латеральная цепь',
    description: 'Боковые линии слева и справа',
    color: 'bg-green-500',
    accentColor: 'green',
    image: '/line3.png',
    group: 'lateral' as const,
  },
  {
    id: 'spiral',
    name: 'Спиральная цепь',
    description: 'Диагональные и ротационные связи',
    color: 'bg-orange-500',
    accentColor: 'orange',
    image: '/line4.png',
    group: 'spiral' as const,
  },
]

export function TabMuscleChains({ visit, allVisits = [], onUpdate }: TabMuscleChainsProps) {
  const getChainStatus = (chainId: string): MuscleChain['status'] => {
    const chain = visit.muscleChains.chains.find((c) => c.id === chainId)
    return chain?.status || 'norm'
  }

  const getChainSideStatus = (
    chainId: string,
    side: 'leftStatus' | 'rightStatus'
  ) => {
    const chain = visit.muscleChains.chains.find((c) => c.id === chainId)
    return chain?.[side] || chain?.status || 'norm'
  }

  const toggleChain = (
    chainId: string,
    chainName: string,
    side?: 'leftStatus' | 'rightStatus'
  ) => {
    const currentChains = [...visit.muscleChains.chains]
    const existingIndex = currentChains.findIndex((c) => c.id === chainId)
    const definition = muscleChainDefinitions.find((c) => c.id === chainId)

    if (existingIndex >= 0) {
      const currentStatus = side
        ? getChainSideStatus(chainId, side)
        : currentChains[existingIndex].status

      const nextStatus = currentStatus === 'norm' ? 'break' : 'norm'

      const nextLeftStatus =
        side === 'leftStatus'
          ? nextStatus
          : currentChains[existingIndex].leftStatus ||
          currentChains[existingIndex].status

      const nextRightStatus =
        side === 'rightStatus'
          ? nextStatus
          : currentChains[existingIndex].rightStatus ||
          currentChains[existingIndex].status

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

  const brokenChains = visit.muscleChains.chains.filter(
    (c) => c.status === 'break'
  )

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Anatomical images */}
        <Card>
          <CardHeader>
            <CardTitle>
              Мышечные цепи — анатомические изображения
            </CardTitle>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              {muscleChainDefinitions.map((chain) => {
                const status = getChainStatus(chain.id)
                const isBreak = status === 'break'

                return (
                  <div
                    key={chain.id}
                    className={cn(
                      'rounded-xl border-2 overflow-hidden transition-all',
                      isBreak ? 'border-destructive' : 'border-border'
                    )}
                  >
                    {/* Image */}
                    <div
                      className="relative w-full overflow-hidden bg-muted"
                      style={{ paddingTop: '120%' }}
                    >
                      <img
                        src={chain.image}
                        alt={chain.name}
                        draggable={false}
                        className="absolute inset-0 w-full h-full object-cover"
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

                    {/* Chain info */}
                    <div className="p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div
                          className={cn(
                            'w-2.5 h-2.5 rounded-full mt-1 shrink-0',
                            chain.color
                          )}
                        />

                        <div>
                          <h4 className="font-semibold text-sm leading-tight">
                            {chain.name}
                          </h4>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            {chain.description}
                          </p>
                        </div>
                      </div>

                      {/* Left / Right controls */}
                      <div className="grid grid-cols-2 gap-1.5">
                        {(['leftStatus', 'rightStatus'] as const).map(
                          (side) => {
                            const sideStatus = getChainSideStatus(
                              chain.id,
                              side
                            )

                            const label =
                              side === 'leftStatus' ? 'Лев' : 'Пра'

                            return (
                              <button
                                key={side}
                                type="button"
                                onClick={() =>
                                  toggleChain(chain.id, chain.name, side)
                                }
                                className={cn(
                                  'rounded-md border px-2 py-1.5 text-xs font-semibold transition-colors',
                                  sideStatus === 'break'
                                    ? 'border-destructive bg-destructive/10 text-destructive'
                                    : 'border-success/30 bg-success/10 text-success'
                                )}
                              >
                                {label}:{' '}
                                {sideStatus === 'break'
                                  ? 'разрыв'
                                  : 'норма'}
                              </button>
                            )
                          }
                        )}
                      </div>

                      {/* Overall status */}
                      <div
                        className={cn(
                          'text-center py-1 rounded text-xs font-bold',
                          isBreak
                            ? 'bg-destructive text-destructive-foreground'
                            : 'bg-success/20 text-success'
                        )}
                      >
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
                <div className="px-2 py-0.5 rounded bg-success/20 text-success text-xs font-medium">
                  ✓ НОРМА
                </div>

                <span className="text-sm">
                  Цепь функционирует
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-medium">
                  ⚠ РАЗРЫВ
                </div>

                <span className="text-sm">
                  Нарушение в цепи
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Broken chains summary */}
        {brokenChains.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>
                Нарушенные цепи ({brokenChains.length})
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {brokenChains.map((chain) => {
                  const definition = muscleChainDefinitions.find(
                    (d) => d.id === chain.id
                  )

                  return (
                    <div
                      key={chain.id}
                      className="flex items-center gap-3 p-3 rounded-lg border border-destructive/30 bg-destructive/5"
                    >
                      <div
                        className={cn(
                          'w-3 h-3 rounded-full shrink-0',
                          definition?.color
                        )}
                      />

                      <div className="flex-1">
                        <p className="font-medium">
                          {chain.name}
                        </p>

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

        {/* Timeline across visits */}
        {allVisits.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Динамика по приёмам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...allVisits]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((v, idx, arr) => {
                    const vDate = format(parseISO(v.date), 'd MMM yyyy', { locale: ru })
                    const broken = v.muscleChains.chains.filter((c) => c.status === 'break')
                    const normal = v.muscleChains.chains.filter((c) => c.status === 'norm')
                    const isCurrentVisit = v.id === visit.id

                    // Get chain status for this visit
                    const getVisitChainStatus = (chainId: string): MuscleChain['status'] => {
                      const chain = v.muscleChains.chains.find((c) => c.id === chainId)
                      return chain?.status || 'norm'
                    }

                    const getVisitChainSideStatus = (
                      chainId: string,
                      side: 'leftStatus' | 'rightStatus'
                    ) => {
                      const chain = v.muscleChains.chains.find((c) => c.id === chainId)
                      return chain?.[side] || chain?.status || 'norm'
                    }

                    // Mini chain indicators
                    const MiniChainIndicator = ({ chainId }: { chainId: string }) => {
                      const status = getVisitChainStatus(chainId)
                      const leftStatus = getVisitChainSideStatus(chainId, 'leftStatus')
                      const rightStatus = getVisitChainSideStatus(chainId, 'rightStatus')
                      const definition = muscleChainDefinitions.find((c) => c.id === chainId)

                      return (
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              'w-3 h-3 rounded-full',
                              status === 'break' ? 'bg-destructive' : 'bg-muted'
                            )}
                          />
                          <div className="flex gap-0.5">
                            <div
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                leftStatus === 'break' ? 'bg-destructive' : 'bg-muted'
                              )}
                            />
                            <div
                              className={cn(
                                'w-1.5 h-1.5 rounded-full',
                                rightStatus === 'break' ? 'bg-destructive' : 'bg-muted'
                              )}
                            />
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div
                        key={v.id}
                        className={cn(
                          'rounded-lg border p-4',
                          isCurrentVisit && 'border-primary bg-primary/5'
                        )}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                              isCurrentVisit ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            )}>
                              {arr.length - idx}
                            </span>
                            <span className="font-medium text-sm">{vDate}</span>
                          </div>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="text-success">✓{normal.length}</span>
                            <span className="text-destructive">⚠{broken.length}</span>
                          </div>
                        </div>

                        {/* Chain indicators grid */}
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {muscleChainDefinitions.map((chain) => (
                            <div key={chain.id} className="flex flex-col items-center">
                              <MiniChainIndicator chainId={chain.id} />
                              <span className="text-[10px] text-muted-foreground text-center mt-1 leading-tight">
                                {chain.name.split(' ')[0]}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Broken chain chips */}
                        <div className="flex flex-wrap gap-1">
                          {broken.slice(0, 4).map((chain) => (
                            <span key={chain.id} className="rounded bg-destructive/20 px-2 py-0.5 text-xs text-destructive">
                              {chain.name}
                            </span>
                          ))}
                          {broken.length > 4 && (
                            <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                              +{broken.length - 4} ещё
                            </span>
                          )}
                        </div>
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
