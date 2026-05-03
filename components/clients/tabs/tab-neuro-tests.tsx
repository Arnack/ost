'use client'

import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Visit, NeuroTest } from '@/lib/types'

interface TabNeuroTestsProps {
  visit: Visit
  allVisits: Visit[]
  onUpdate: (updates: Partial<Visit>) => void
}

const defaultTests = [
  'Ласега',
  'Нери',
  'Дежерина',
  'Бонне',
  'Вассермана',
  'Мацкевича',
  'Сикара',
  'Турина',
  'Патрика (FABER)',
  'Кемпа',
  'Гельмана',
  'Спурлинга',
  'Кернига',
  'Брудзинского',
]

export function TabNeuroTests({ visit, allVisits, onUpdate }: TabNeuroTestsProps) {
  // Get previous visits for comparison (up to last 3)
  const previousVisits = allVisits
    .filter((v) => v.id !== visit.id && new Date(v.date) < new Date(visit.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 2)

  // Add new test
  const addTest = (testName?: string) => {
    const newTest: NeuroTest = {
      id: crypto.randomUUID(),
      name: testName || 'Новый тест',
      results: {
        current: '',
      },
    }

    onUpdate({
      neuroTests: [...visit.neuroTests, newTest],
    })
  }

  // Update test
  const updateTest = (testId: string, field: 'name' | 'current' | 'postSession', value: string) => {
    const updatedTests = visit.neuroTests.map((test) => {
      if (test.id === testId) {
        if (field === 'name') {
          return { ...test, name: value }
        }
        return {
          ...test,
          results: {
            ...test.results,
            [field]: value,
          },
        }
      }
      return test
    })

    onUpdate({ neuroTests: updatedTests })
  }

  // Delete test
  const deleteTest = (testId: string) => {
    onUpdate({
      neuroTests: visit.neuroTests.filter((t) => t.id !== testId),
    })
  }

  // Get result from previous visit for a test name
  const getPreviousResult = (testName: string, visitIndex: number): string => {
    const prevVisit = previousVisits[visitIndex]
    if (!prevVisit) return ''
    const test = prevVisit.neuroTests.find((t) => t.name === testName)
    return test?.results.current || ''
  }

  // Add default tests if none exist
  const addDefaultTests = () => {
    const newTests: NeuroTest[] = defaultTests.map((name) => ({
      id: crypto.randomUUID(),
      name,
      results: { current: '' },
    }))
    onUpdate({ neuroTests: newTests })
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Неврологические тесты</CardTitle>
            <div className="flex gap-2">
              {visit.neuroTests.length === 0 && (
                <Button variant="outline" onClick={addDefaultTests}>
                  Добавить стандартные тесты
                </Button>
              )}
              <Button onClick={() => addTest()}>
                <Plus className="mr-2 h-4 w-4" />
                Добавить тест
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {visit.neuroTests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Нет тестов</p>
                <p className="text-sm">Добавьте тесты для отслеживания</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[200px]">Тест</TableHead>
                      <TableHead>До сеанса</TableHead>
                      <TableHead>После сеанса</TableHead>
                      {previousVisits.length > 0 && (
                        <TableHead className="text-muted-foreground">
                          Пред. визит
                        </TableHead>
                      )}
                      {previousVisits.length > 1 && (
                        <TableHead className="text-muted-foreground">
                          2 визита назад
                        </TableHead>
                      )}
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visit.neuroTests.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          <Input
                            value={test.name}
                            onChange={(e) => updateTest(test.id, 'name', e.target.value)}
                            className="h-9 font-medium"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={test.results.current}
                            onChange={(e) => updateTest(test.id, 'current', e.target.value)}
                            placeholder="+/-, L/R, описание"
                            className="h-9"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={test.results.postSession || ''}
                            onChange={(e) => updateTest(test.id, 'postSession', e.target.value)}
                            placeholder="После сеанса"
                            className="h-9"
                          />
                        </TableCell>
                        {previousVisits.length > 0 && (
                          <TableCell className="text-muted-foreground text-sm">
                            {getPreviousResult(test.name, 0) || '—'}
                          </TableCell>
                        )}
                        {previousVisits.length > 1 && (
                          <TableCell className="text-muted-foreground text-sm">
                            {getPreviousResult(test.name, 1) || '—'}
                          </TableCell>
                        )}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTest(test.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick add common tests */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Быстрое добавление</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {defaultTests
                .filter((name) => !visit.neuroTests.some((t) => t.name === name))
                .map((name) => (
                  <Button
                    key={name}
                    variant="outline"
                    size="sm"
                    onClick={() => addTest(name)}
                    className="h-8"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    {name}
                  </Button>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  )
}
