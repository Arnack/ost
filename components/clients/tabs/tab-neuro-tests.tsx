'use client'

import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Visit, NeuroTest } from '@/lib/types'

interface TabNeuroTestsProps {
  visit: Visit
  allVisits: Visit[]
  onUpdate: (updates: Partial<Visit>) => void
}

type TestField = {
  key: string
  label: string
  placeholder: string
  type?: 'status'
}

type TestSection = {
  name: string
  fields: TestField[]
}

const defaultTestSections: TestSection[] = [
  {
    name: 'Ромберг',
    fields: [
      { key: 'left', label: 'Левый', placeholder: 'сек.' },
      { key: 'right', label: 'Правый', placeholder: 'сек.' },
    ],
  },
  {
    name: 'Квадрат',
    fields: [
      { key: 'value', label: 'Значение', placeholder: 'сек.' },
    ],
  },
  {
    name: 'Пальце-носовая проба',
    fields: [
      { key: 'left', label: 'Левый', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'right', label: 'Правый', placeholder: 'норма / отклонение', type: 'status' },
    ],
  },
  {
    name: 'Подвижность суставов',
    fields: [
      { key: 'squat', label: 'Приседание', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'lungeLeft', label: 'Выпад левый', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'lungeRight', label: 'Выпад правый', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'forwardBend', label: 'Наклон вперёд', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'armRaiseLeft', label: 'Подъём рук лево', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'armRaiseRight', label: 'Подъём рук право', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'legAbductionLeft', label: 'Отведение ноги лев', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'legAbductionRight', label: 'Отведение ноги прав', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'sideArmAbductionLeft', label: 'Отведение ноги боково лев', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'sideArmAbductionRight', label: 'Отведение ноги боково прав', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'armSideRaiseLeftRight', label: 'Подъём рук через стороны лево/право', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'torsoTiltLeftRight', label: 'Наклон туловища влево/вправо', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'handsBehindBackLeftRight', label: 'Руки за спину лев/прав', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'headTiltLeftRight', label: 'Наклон головы влево/вправо', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'headTurnLeftRight', label: 'Поворот головы влево/вправо', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'stabilityLeft', label: 'Стабильность левая', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'stabilityRight', label: 'Стабильность правая', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'backwardBend', label: 'Наклон назад', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'tiltLeft', label: 'Наклон влево', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'tiltRight', label: 'Наклон вправо', placeholder: 'норма / отклонение', type: 'status' },
      { key: 'notes', label: 'Комментарий', placeholder: 'Дополнительные наблюдения' },
    ],
  },
]

const legacyMobilityTestNames: Record<string, string> = {
  stabilityLeft: 'Стабильность левая',
  stabilityRight: 'Стабильность правая',
  forwardBend: 'Наклон вперёд',
  backwardBend: 'Наклон назад',
  tiltLeft: 'Наклон влево',
  tiltRight: 'Наклон вправо',
}

export function TabNeuroTests({ visit, allVisits, onUpdate }: TabNeuroTestsProps) {
  const previousVisits = allVisits
    .filter((v) => v.id !== visit.id && new Date(v.date) < new Date(visit.date))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)

  const createTest = (testName: string): NeuroTest => ({
    id: crypto.randomUUID(),
    name: testName,
    results: {
      current: '',
      date: new Date().toISOString().slice(0, 10),
    },
  })

  const displayedTests = [
    ...defaultTestSections.map((section) => {
      return visit.neuroTests.find((test) => test.name === section.name) || createTest(section.name)
    }),
    ...visit.neuroTests.filter((test) => !defaultTestSections.some((section) => section.name === test.name)),
  ]

  // Add new test
  const addTest = (testName?: string) => {
    const newTest: NeuroTest = {
      id: crypto.randomUUID(),
      name: testName || 'Новый тест',
      results: {
        current: '',
        date: new Date().toISOString().slice(0, 10),
      },
    }

    onUpdate({
      neuroTests: [...visit.neuroTests, newTest],
    })
  }

  const updateTestName = (testId: string, value: string) => {
    onUpdate({
      neuroTests: visit.neuroTests.map((test) =>
        test.id === testId ? { ...test, name: value } : test
      ),
    })
  }

  const updateTestResult = (testName: string, field: string, value: string) => {
    const existingTest = visit.neuroTests.find((test) => test.name === testName)
    const testToUpdate = existingTest || createTest(testName)
    const updatedTest: NeuroTest = {
      ...testToUpdate,
      results: {
        ...testToUpdate.results,
        [field]: value,
      },
    }

    onUpdate({
      neuroTests: existingTest
        ? visit.neuroTests.map((test) => test.id === existingTest.id ? updatedTest : test)
        : [...visit.neuroTests, updatedTest],
    })
  }

  // Delete test
  const deleteTest = (testId: string) => {
    onUpdate({
      neuroTests: visit.neuroTests.filter((t) => t.id !== testId),
    })
  }

  const getPreviousResult = (testName: string, visitIndex: number, field = 'current'): string => {
    const prevVisit = previousVisits[visitIndex]
    if (!prevVisit) return ''
    const test = prevVisit.neuroTests.find((t) => t.name === testName)
    const currentValue = String((test?.results as Record<string, string | undefined> | undefined)?.[field] || '')
    if (currentValue) return currentValue
    if (testName === 'Подвижность суставов' && legacyMobilityTestNames[field]) {
      const legacyTest = prevVisit.neuroTests.find((t) => t.name === legacyMobilityTestNames[field])
      return String((legacyTest?.results as Record<string, string | undefined> | undefined)?.value || '')
    }
    return ''
  }

  const getTestResult = (testName: string, field: string) => {
    const test = displayedTests.find((item) => item.name === testName)
    const currentValue = String((test?.results as Record<string, string | undefined> | undefined)?.[field] || '')
    if (currentValue) return currentValue
    if (testName === 'Подвижность суставов' && legacyMobilityTestNames[field]) {
      const legacyTest = visit.neuroTests.find((item) => item.name === legacyMobilityTestNames[field])
      return String((legacyTest?.results as Record<string, string | undefined> | undefined)?.value || '')
    }
    return ''
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="space-y-4">
          {defaultTestSections.map((section) => (
            <Card key={section.name}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <CardTitle className="text-base">{section.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Дата</span>
                    <Input
                      type="date"
                      value={getTestResult(section.name, 'date')}
                      onChange={(e) => updateTestResult(section.name, 'date', e.target.value)}
                      className="h-9 w-40"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-[minmax(320px,1fr)_repeat(auto-fit,minmax(120px,160px))]">
                  <div className="rounded-xl border bg-muted/20 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {section.fields.map((field) => (
                        <div key={field.key} className="grid gap-2">
                          <label className="text-sm font-medium">{field.label}</label>
                          {field.type === 'status' ? (
                            <Select
                              value={getTestResult(section.name, field.key)}
                              onValueChange={(value) => updateTestResult(section.name, field.key, value)}
                            >
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Выберите" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Норма</SelectItem>
                                <SelectItem value="deviation">Отклонение</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : field.key === 'notes' ? (
                            <Textarea
                              value={getTestResult(section.name, field.key)}
                              onChange={(e) => updateTestResult(section.name, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="min-h-28 resize-none"
                            />
                          ) : (
                            <Input
                              value={getTestResult(section.name, field.key)}
                              onChange={(e) => updateTestResult(section.name, field.key, e.target.value)}
                              placeholder={field.placeholder}
                              className="h-10"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {previousVisits.map((previousVisit, index) => (
                    <div key={index} className="min-h-28 rounded-xl border bg-muted/10 p-3">
                      <p className="text-xs font-medium text-muted-foreground">
                        {new Date(previousVisit.date).toLocaleDateString('ru-RU')}
                      </p>
                      <div className="mt-3 space-y-2 text-sm">
                        {section.fields.map((field) => (
                          <div key={field.key}>
                            <p className="text-xs text-muted-foreground">{field.label}</p>
                            <p className="font-medium">
                              {getPreviousResult(section.name, index, field.key) || '—'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => addTest()}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить тест
          </Button>
        </div>

        {displayedTests.filter((test) => !defaultTestSections.some((section) => section.name === test.name) && !Object.values(legacyMobilityTestNames).includes(test.name)).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Дополнительные тесты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {displayedTests
                  .filter((test) => !defaultTestSections.some((section) => section.name === test.name) && !Object.values(legacyMobilityTestNames).includes(test.name))
                  .map((test) => (
                    <div key={test.id} className="grid gap-3 rounded-xl border bg-muted/20 p-3 md:grid-cols-[220px_160px_1fr_auto]">
                      <Input
                        value={test.name}
                        onChange={(e) => updateTestName(test.id, e.target.value)}
                        className="h-9 font-medium"
                      />
                      <Input
                        type="date"
                        value={String((test.results as Record<string, string | undefined>).date || '')}
                        onChange={(e) => updateTestResult(test.name, 'date', e.target.value)}
                        className="h-9"
                      />
                      <Input
                        value={test.results.current}
                        onChange={(e) => updateTestResult(test.name, 'current', e.target.value)}
                        placeholder="Значение"
                        className="h-9"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTest(test.id)}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  )
}
